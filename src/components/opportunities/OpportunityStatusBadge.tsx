import { Badge } from "../ui/shadcn/badge";

type OpportunityStatus = "pending_approval" | "approved";

const STATUS_COPY: Record<OpportunityStatus, string> = {
  approved: "Approved",
  pending_approval: "Pending approval",
};

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  const className =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <Badge variant="outline" className={className}>
      {STATUS_COPY[status]}
    </Badge>
  );
}
