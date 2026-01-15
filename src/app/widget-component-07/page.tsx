import GeneralFinanceReviewsCard from "@/components/shadcn-studio/blocks/widget-general-finance-reviews"

const stats = [
  {
    className: "bg-primary",
    label: "Profit",
    value: "$8,042",
    change: 16,
    changeType: "decrease",
  },
  {
    className: "bg-primary/10",
    label: "Sales",
    value: "42",
    change: 6,
    changeType: "increase",
  },
  {
    className: "bg-primary/20",
    label: "User",
    value: "1,200",
    change: 21,
    changeType: "increase",
  },
]

const WidgetCardPreview = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-16">
      <div className="flex justify-center">
        <GeneralFinanceReviewsCard
          title="General Finance Reviews"
          amount="$50,232"
          period="Last 6 months Statics"
          progressLabel="Current Activity"
          progressValue={25}
          stats={stats}
          className="w-full max-w-100"
        />
      </div>
    </div>
  )
}

export default WidgetCardPreview
