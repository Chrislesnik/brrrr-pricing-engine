import { Liveblocks } from "@liveblocks/node";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function notifyDealAssignment(
  userId: string,
  data: { dealId: string; dealName: string; assignerName: string }
) {
  try {
    await liveblocks.triggerInboxNotification({
      userId,
      kind: "$dealAssignment",
      subjectId: `deal-assign-${data.dealId}`,
      roomId: `deal:${data.dealId}`,
      activityData: data,
    });
  } catch (err) {
    console.error("[notifyDealAssignment] failed:", err);
  }
}

export async function notifyTaskAssignment(
  userId: string,
  data: { dealId: string; taskName: string; assignerName: string }
) {
  try {
    await liveblocks.triggerInboxNotification({
      userId,
      kind: "$taskAssignment",
      subjectId: `task-assign-${data.dealId}-${data.taskName}`,
      roomId: `deal:${data.dealId}`,
      activityData: data,
    });
  } catch (err) {
    console.error("[notifyTaskAssignment] failed:", err);
  }
}

export async function notifyLoanAssignment(
  userId: string,
  data: { loanId: string; dealId: string; assignerName: string }
) {
  try {
    await liveblocks.triggerInboxNotification({
      userId,
      kind: "$loanAssignment",
      subjectId: `loan-assign-${data.loanId}`,
      roomId: `deal:${data.dealId}`,
      activityData: data,
    });
  } catch (err) {
    console.error("[notifyLoanAssignment] failed:", err);
  }
}

export async function notifyDealStatusChange(
  userId: string,
  data: {
    dealId: string;
    dealName: string;
    newStage: string;
    previousStage?: string;
  }
) {
  try {
    await liveblocks.triggerInboxNotification({
      userId,
      kind: "$dealStatusChange",
      subjectId: `deal-status-${data.dealId}`,
      roomId: `deal:${data.dealId}`,
      activityData: data,
    });
  } catch (err) {
    console.error("[notifyDealStatusChange] failed:", err);
  }
}

export async function notifyApplicationCompleted(
  userId: string,
  data: { loanId: string; dealId: string; borrowerName: string }
) {
  try {
    await liveblocks.triggerInboxNotification({
      userId,
      kind: "$applicationCompleted",
      subjectId: `app-completed-${data.loanId}`,
      roomId: `deal:${data.dealId}`,
      activityData: data,
    });
  } catch (err) {
    console.error("[notifyApplicationCompleted] failed:", err);
  }
}
