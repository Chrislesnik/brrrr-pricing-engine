declare global {
  interface Liveblocks {
    UserMeta: {
      id: string
      info: {
        name: string
        avatar: string
      }
    }

    // Required for useThreads, FloatingComposer, FloatingThreads, AnchoredThreads
    ThreadMetadata: {}

    ActivitiesData: {
      $taskAssignment: {
        dealId: string
        taskName: string
        assignerName: string
      }
      $loanAssignment: {
        loanId: string
        dealId: string
        assignerName: string
      }
      $dealAssignment: {
        dealId: string
        dealName: string
        assignerName: string
      }
      $applicationCompleted: {
        loanId: string
        dealId: string
        borrowerName: string
      }
      $dealStatusChange: {
        dealId: string
        dealName: string
        newStage: string
        previousStage?: string
      }
    }
  }
}

export {}
