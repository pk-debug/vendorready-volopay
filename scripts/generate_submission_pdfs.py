from __future__ import annotations

from pathlib import Path


OUT = Path("docs/submission")
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (0.07, 0.15, 0.25)
TEAL = (0.03, 0.55, 0.52)
INK = (0.13, 0.18, 0.24)
MUTED = (0.38, 0.44, 0.51)
PALE = (0.93, 0.97, 0.97)
LIGHT = (0.95, 0.96, 0.98)
WHITE = (1, 1, 1)


def pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class Page:
    def __init__(self) -> None:
        self.ops: list[str] = []

    def rect(
        self,
        x: float,
        y: float,
        width: float,
        height: float,
        color: tuple[float, float, float],
        stroke: bool = False,
    ) -> None:
        self.ops.append("q")
        self.ops.append(f"{color[0]} {color[1]} {color[2]} rg")
        if stroke:
            self.ops.append(f"{color[0]} {color[1]} {color[2]} RG")
        self.ops.append(f"{x} {y} {width} {height} re {'B' if stroke else 'f'}")
        self.ops.append("Q")

    def line(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        color: tuple[float, float, float] = MUTED,
        width: float = 1,
    ) -> None:
        self.ops.extend(
            [
                "q",
                f"{width} w",
                f"{color[0]} {color[1]} {color[2]} RG",
                f"{x1} {y1} m {x2} {y2} l S",
                "Q",
            ]
        )

    def text(
        self,
        x: float,
        y: float,
        value: str,
        size: float = 10,
        font: str = "F1",
        color: tuple[float, float, float] = INK,
    ) -> None:
        safe = value.encode("ascii", "replace").decode("ascii")
        self.ops.extend(
            [
                "BT",
                f"/{font} {size} Tf",
                f"{color[0]} {color[1]} {color[2]} rg",
                f"1 0 0 1 {x} {y} Tm",
                f"({pdf_escape(safe)}) Tj",
                "ET",
            ]
        )

    def wrap(
        self,
        x: float,
        y: float,
        value: str,
        max_width: float,
        size: float = 9.5,
        leading: float = 13,
        font: str = "F1",
        color: tuple[float, float, float] = INK,
    ) -> float:
        words = value.split()
        rows: list[str] = []
        current = ""
        for word in words:
            proposed = f"{current} {word}".strip()
            if len(proposed) * size * 0.51 > max_width and current:
                rows.append(current)
                current = word
            else:
                current = proposed
        if current:
            rows.append(current)
        for row in rows:
            self.text(x, y, row, size=size, font=font, color=color)
            y -= leading
        return y


class Document:
    def __init__(self, title: str) -> None:
        self.title = title
        self.pages: list[Page] = []

    def new_page(self, label: str) -> Page:
        page = Page()
        self.pages.append(page)
        page.rect(0, 0, 612, 792, WHITE)
        page.rect(0, 776, 612, 16, NAVY)
        page.text(42, 752, self.title, 9, "F2", NAVY)
        page.text(42, 25, label, 8, "F1", MUTED)
        page.text(548, 25, f"{len(self.pages)}", 8, "F2", MUTED)
        return page

    def save(self, path: Path) -> None:
        objects: list[bytes] = []

        def add(data: bytes) -> int:
            objects.append(data)
            return len(objects)

        catalog_id = add(b"")
        pages_id = add(b"")
        regular_id = add(
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        )
        bold_id = add(
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
        )
        page_ids: list[int] = []
        for page in self.pages:
            stream = "\n".join(page.ops).encode("ascii")
            content_id = add(
                b"<< /Length "
                + str(len(stream)).encode("ascii")
                + b" >>\nstream\n"
                + stream
                + b"\nendstream"
            )
            page_id = add(
                (
                    f"<< /Type /Page /Parent {pages_id} 0 R "
                    f"/MediaBox [0 0 612 792] "
                    f"/Resources << /Font << /F1 {regular_id} 0 R "
                    f"/F2 {bold_id} 0 R >> >> "
                    f"/Contents {content_id} 0 R >>"
                ).encode("ascii")
            )
            page_ids.append(page_id)
        kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
        objects[catalog_id - 1] = (
            f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode("ascii")
        )
        objects[pages_id - 1] = (
            f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode(
                "ascii"
            )
        )
        data = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for index, obj in enumerate(objects, start=1):
            offsets.append(len(data))
            data.extend(f"{index} 0 obj\n".encode("ascii"))
            data.extend(obj)
            data.extend(b"\nendobj\n")
        xref_offset = len(data)
        data.extend(f"xref\n0 {len(offsets)}\n".encode("ascii"))
        data.extend(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            data.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
        data.extend(
            (
                f"trailer\n<< /Size {len(offsets)} /Root {catalog_id} 0 R >>\n"
                f"startxref\n{xref_offset}\n%%EOF\n"
            ).encode("ascii")
        )
        path.write_bytes(data)


def heading(page: Page, y: float, title: str, subtitle: str | None = None) -> float:
    page.text(42, y, title, 19, "F2", NAVY)
    y -= 18
    if subtitle:
        page.text(42, y, subtitle, 9, "F1", MUTED)
        y -= 20
    return y


def section(page: Page, y: float, title: str, body: str, width: float = 528) -> float:
    page.text(42, y, title, 11, "F2", TEAL)
    y -= 15
    return page.wrap(42, y, body, width, size=9.2, leading=12.1) - 7


def bullet(page: Page, y: float, body: str, max_width: float = 510) -> float:
    page.text(48, y, "-", 9.2, "F2", TEAL)
    return page.wrap(61, y, body, max_width, size=9.1, leading=11.8) - 3


def make_strategy() -> Path:
    doc = Document("VENDORREADY | BUSINESS STRATEGY + PRODUCT EXECUTION")
    page = doc.new_page("VendorReady | Submission strategy")
    y = heading(
        page,
        715,
        "Business Strategy",
        "A persistent supplier-readiness workspace, powered by a customer's own Claude",
    )
    page.rect(42, y - 47, 528, 48, PALE)
    page.text(54, y - 19, "THE IDEA", 8, "F2", TEAL)
    page.wrap(
        54,
        y - 34,
        "Turn a plain-language request in Claude into an editable, durable supplier onboarding record shared with the operations team.",
        500,
        9.2,
        12,
    )
    y -= 67
    y = section(
        page,
        y,
        "Problem",
        "Small businesses collect supplier agreements, registration evidence, contacts and approvals across email, chat and spreadsheets. Requirements get duplicated, status becomes stale, and a useful AI-generated checklist can be lost when a chat ends. Teams need a lightweight source of truth that people can update after the conversation.",
    )
    y = section(
        page,
        y,
        "Target customer and first use case",
        "Initial customer hypothesis: Indian SMB finance, procurement and operations teams that onboard several suppliers repeatedly but do not need a large procurement suite. The first job is to create a checklist, assign a due date, track completion, and let a human correct the record before the supplier is ready for an internal handoff.",
    )
    y = section(
        page,
        y,
        "Product and differentiation",
        "The user asks in their Claude account; Claude calls VendorReady over remote MCP. The application validates and stores the supplier and checklist in D1. A manager uses the web app to edit supplier details, requirements and completion status. Claude can retrieve the updated record through MCP. Claude provides reasoning; VendorReady provides persistence, an operational interface and a shared state after chat ends. The app itself makes no model API calls.",
    )
    y = section(
        page,
        y,
        "Business model and growth potential",
        "Pricing hypothesis for a small-team pilot: INR 999 per organization per month, not validated. Five design-partner pilots would test repeat use and willingness to pay. At 100 paying organizations, the illustrative subscription run rate is INR 99,900 monthly (INR 1,198,800 annualized before costs and taxes); this is a scenario, not a forecast. Customers bring their own Claude subscription. VendorReady would still bear hosting, support, security, payment and acquisition costs.",
    )
    y = section(
        page,
        y,
        "Acquisition and validation",
        "Start with founder-led outreach to SMB finance and operations leads, then seek referrals from accountants and fractional finance operators. Interview users, observe onboarding workflows, and measure repeated checklist use, time to create a record, completion visibility and willingness to pay. Expand only if pilots show repeat value; test adjacent integrations with customer evidence rather than assuming demand.",
    )
    y = section(
        page,
        y,
        "Risks and assumptions",
        "Teams may prefer spreadsheets or existing procurement systems. MCP availability and connector policies vary. The current shared demo is not production-grade multi-tenant software. A completed checkbox means a person marked an item complete; it is not legal, tax, identity or bank verification. Pricing and growth figures are unvalidated hypotheses.",
    )

    page2 = doc.new_page("VendorReady | Product execution")
    y = heading(
        page2,
        715,
        "Product Execution",
        "Working prototype and verified Claude-to-app workflow",
    )
    y = section(
        page2,
        y,
        "Live links",
        "Web application: https://vendorready-volopay.coder-pawan1.workers.dev\nHealth endpoint: https://vendorready-volopay.coder-pawan1.workers.dev/api/health\nRemote MCP endpoint: https://vendorready-volopay.coder-pawan1.workers.dev/mcp\nSource repository: https://github.com/pk-debug/vendorready-volopay",
    )
    y = section(
        page2,
        y,
        "What is built and demonstrated",
        "A React web dashboard, Cloudflare Worker REST API and remote MCP tools are deployed together. MCP can create, retrieve and list onboarding records. The browser app can search and filter suppliers, edit supplier details and checklist items, and persist changes. Cloudflare D1 stores the same records used by both Claude and the browser. The deployed health endpoint returned ok=true and ai_inside_app=false.",
    )
    y = section(
        page2,
        y,
        "End-to-end test performed",
        "Claude created the fictional Acme Test Supplies record through the VendorReady MCP connector. It appeared in the live dashboard. The checklist was edited in the browser, and Claude subsequently retrieved the record and reported all six items complete. This verifies the actual integration and persistence path, not a mock response.",
    )
    y = section(
        page2,
        y,
        "Simulated, excluded, and access notes",
        "Tax, bank and document checklist entries are fictional placeholders only. The prototype does not verify documents, tax registration or bank ownership; it does not initiate payments, send reminders, upload files, integrate with an ERP or provide tenant isolation. Do not enter real supplier-sensitive data. The demo login and MCP key are private credentials and are intentionally not printed in this document. Share access only through a reviewer-approved secure channel; the submission form warns not to submit passwords.",
    )
    page2.rect(42, 105, 528, 64, LIGHT)
    page2.text(54, 151, "PRODUCT LINK FIELD", 8, "F2", TEAL)
    page2.wrap(
        54,
        134,
        "Use the live app URL above for the prototype link and the /mcp URL for MCP. Provide any required private access details only through a secure channel approved by the assignment team.",
        500,
        8.8,
        11.5,
    )
    path = OUT / "VendorReady_Strategy_and_Product_Execution.pdf"
    doc.save(path)
    return path


def draw_box(
    page: Page,
    x: float,
    y: float,
    width: float,
    height: float,
    title: str,
    lines: list[str],
    fill: tuple[float, float, float] = LIGHT,
) -> None:
    page.rect(x, y, width, height, fill, stroke=True)
    page.text(x + 11, y + height - 19, title, 10, "F2", NAVY)
    current_y = y + height - 36
    for line in lines:
        page.text(x + 11, current_y, line, 8, "F1", INK)
        current_y -= 12


def make_architecture() -> Path:
    doc = Document("VENDORREADY | ARCHITECTURE + IMPLEMENTATION NOTES")
    page = doc.new_page("VendorReady | Architecture")
    y = heading(
        page,
        715,
        "Architecture",
        "Built prototype: one Cloudflare Worker, one D1 database, one shared demo workspace",
    )
    draw_box(page, 42, 565, 220, 82, "Customer's Claude", [
        "Customer's Claude subscription",
        "No model calls inside VendorReady",
        "Remote MCP connector + API key",
    ], PALE)
    draw_box(page, 350, 565, 220, 82, "Operations browser", [
        "React + Vite web interface",
        "Signed demo session",
        "REST requests to the Worker",
    ], PALE)
    draw_box(page, 170, 390, 272, 111, "Cloudflare Worker: vendorready-volopay", [
        "MCP endpoint: /mcp",
        "REST API: /api/*",
        "Input validation + session / MCP auth",
        "Static app assets served by Worker",
    ], (0.90, 0.95, 0.96))
    draw_box(page, 215, 210, 182, 78, "Cloudflare D1", [
        "Supplier records",
        "Checklist items + completion",
        "Shared persistence",
    ], PALE)

    page.line(150, 565, 237, 501, TEAL, 1.5)
    page.line(460, 565, 377, 501, TEAL, 1.5)
    page.line(306, 390, 306, 288, TEAL, 1.5)
    page.text(58, 526, "MCP over HTTPS", 8, "F2", TEAL)
    page.text(422, 526, "REST over HTTPS", 8, "F2", TEAL)
    page.text(316, 330, "D1 binding", 8, "F2", TEAL)
    page.wrap(
        42,
        160,
        "Data flow: Claude submits a structured tool call; the Worker authenticates and validates it, then reads or writes D1. The browser uses the Worker REST API to display and edit the same record. A subsequent MCP read returns the persisted state. The browser session and MCP credential are separate controls.",
        528,
        9.2,
        13,
    )

    page2 = doc.new_page("VendorReady | Implementation notes")
    y = heading(
        page2,
        715,
        "Implementation Notes",
        "README summary for the assignment reviewer",
    )
    y = section(
        page2,
        y,
        "Data flow and tools",
        "Built with React, TypeScript and Vite for the browser UI; a Cloudflare Worker hosts the REST API, static assets and remote MCP endpoint; Cloudflare D1 stores onboarding records. GitHub Actions runs checks and a manually confirmed deployment. Claude is an external client using its own account and connector. MCP carries tool requests; it is not a model or payment integration.",
    )
    y = section(
        page2,
        y,
        "Responsibility boundary: Volopay vs. partner",
        "This is an independent assignment prototype, not a Volopay product integration. The built scope covers the demo workspace, checklist tracking and Claude/MCP interaction. No Volopay production APIs, accounts, payment rails, supplier verification or internal systems are connected. In a proposed partnership, Volopay would define product ownership, customer permissions, risk/compliance policy and any approved finance-system integration; VendorReady would provide workflow UX and integration components only under agreed security, legal and technical review. These are proposed boundaries, not commitments or existing integrations.",
    )
    y = section(
        page2,
        y,
        "Built vs. proposed production system",
        "Built and verified: create/list/get supplier onboarding through MCP; browser-based editing; D1 persistence; demo login; deployed health endpoint; GitHub Actions deployment. Proposed, not built: tenant-specific identity and authorization, supplier portal, document upload, verification providers, notifications, audit export, billing, ERP/payment integrations, production monitoring and service-level commitments.",
    )
    y = section(
        page2,
        y,
        "Assumptions and limitations",
        "The demo is a shared fictional workspace and is not appropriate for real personal, tax, banking or supplier-sensitive data. Checklist completion is human-reported and does not prove document validity. Demo credentials and MCP API key are private and are not included here. The app has no AI model API key or inference service. The INR 999/month price is a hypothesis; customer demand, acquisition cost, retention and willingness to pay have not been tested.",
    )
    y = section(
        page2,
        y,
        "Next steps",
        "Run customer interviews and five design-partner pilots; validate repeat usage and willingness to pay; design tenant isolation and least-privilege access; complete a security/privacy review before handling real data; only then evaluate document intake, notifications and finance integrations. Track the real Claude-to-D1 workflow and human edits as the prototype baseline.",
    )
    page2.rect(42, 105, 528, 46, PALE)
    page2.wrap(
        54,
        132,
        "No private credentials are embedded in this PDF. Provide reviewer access only through a secure channel approved by the assignment team.",
        500,
        8.8,
        11.5,
    )
    path = OUT / "VendorReady_Architecture_and_Implementation_Notes.pdf"
    doc.save(path)
    return path


if __name__ == "__main__":
    for output in (make_strategy(), make_architecture()):
        print(output.resolve())
