"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
import {
  FilePlus,
  FileSignature,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Download,
  Ban,
  Trash2,
  Bell,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/shadcn/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/shadcn/tooltip";
import { NewSignatureRequestDialog } from "./new-signature-request-dialog";

interface DealSignatureRequestsTabProps {
  dealId: string;
}

type SignatureStatus = "pending" | "signed" | "declined" | "expired" | "cancelled";

interface Recipient {
  email: string;
  name: string;
  status: string;
}

interface SignatureRequest {
  id: string;
  deal_id: string;
  documenso_document_id: string;
  document_name: string;
  status: SignatureStatus;
  recipients: Recipient[];
  created_by_user_id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

type ConfirmAction = {
  requestId: string;
  action: "cancel" | "cancel-delete" | "delete";
  label: string;
  description: string;
};

export function DealSignatureRequestsTab({ dealId }: DealSignatureRequestsTabProps) {
  const [signatureRequests, setSignatureRequests] = useState<SignatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [isActioning, setIsActioning] = useState(false);

  const fetchSignatureRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/signature-requests?dealId=${dealId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch signature requests");
      }

      const data = await response.json();
      setSignatureRequests(data.requests || []);
    } catch (err) {
      console.error("Error fetching signature requests:", err);
      setError(err instanceof Error ? err.message : "Failed to load signature requests");
    } finally {
      setIsLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchSignatureRequests();
  }, [fetchSignatureRequests]);

  const handleDownload = async (request: SignatureRequest) => {
    try {
      const res = await fetch(`/api/signature-requests/${request.id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${request.document_name || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download document");
    }
  };

  const handleRemind = async (request: SignatureRequest) => {
    try {
      const res = await fetch(`/api/signature-requests/${request.id}/resend`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reminder");
      }
    } catch (err) {
      console.error("Remind error:", err);
      setError(err instanceof Error ? err.message : "Failed to send reminder");
    }
  };

  const handleConfirmedAction = async () => {
    if (!confirmAction) return;
    setIsActioning(true);

    try {
      const res = await fetch(
        `/api/signature-requests/${confirmAction.requestId}?action=${confirmAction.action}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }
      await fetchSignatureRequests();
    } catch (err) {
      console.error("Action error:", err);
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsActioning(false);
      setConfirmAction(null);
    }
  };

  const getStatusBadge = (status: SignatureStatus) => {
    switch (status) {
      case "signed":
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Signed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Declined
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
    }
  };

  const getRecipientsDisplay = (recipients: Recipient[]) => {
    if (!recipients || recipients.length === 0) return "—";
    
    if (recipients.length === 1) {
      return recipients[0].name || recipients[0].email;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help underline decoration-dotted">
              {recipients.length} recipients
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <ul className="text-sm">
              {recipients.map((r, i) => (
                <li key={i}>
                  {r.name || r.email}
                  {r.status && (
                    <span className="text-muted-foreground ml-1">
                      ({r.status})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="font-semibold mb-2">Failed to load signature requests</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSignatureRequests}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Signature Requests</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage document signatures
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSignatureRequests}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Signature Request
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Signature Requests</CardTitle>
          <CardDescription>
            View and manage signature requests for this deal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatureRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileSignature className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No signature requests
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first signature request to get started
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <FilePlus className="mr-2 h-4 w-4" />
                New Signature Request
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signatureRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-muted-foreground" />
                        {request.document_name}
                      </div>
                    </TableCell>
                    <TableCell>{getRecipientsDisplay(request.recipients)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(request.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(request)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>

                          {request.status === "pending" && (
                            <DropdownMenuItem onClick={() => handleRemind(request)}>
                              <Bell className="mr-2 h-4 w-4" />
                              Remind
                            </DropdownMenuItem>
                          )}

                          {request.status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmAction({
                                    requestId: request.id,
                                    action: "cancel",
                                    label: "Cancel Request",
                                    description:
                                      "This will cancel the signature request in Documenso. Recipients will no longer be able to sign.",
                                  })
                                }
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Cancel
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setConfirmAction({
                                    requestId: request.id,
                                    action: "cancel-delete",
                                    label: "Cancel & Delete",
                                    description:
                                      "This will cancel the request in Documenso and permanently remove the record. This cannot be undone.",
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel & Delete
                              </DropdownMenuItem>
                            </>
                          )}

                          {request.status !== "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() =>
                                  setConfirmAction({
                                    requestId: request.id,
                                    action: "delete",
                                    label: "Delete Record",
                                    description:
                                      "This will permanently remove this record from the list. This cannot be undone.",
                                  })
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Signature Request Dialog */}
      <NewSignatureRequestDialog
        dealId={dealId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchSignatureRequests}
      />

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActioning}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              disabled={isActioning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActioning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmAction?.label
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
