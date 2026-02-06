"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@repo/ui/shadcn/button";
import { Badge } from "@repo/ui/shadcn/badge";
import { FilePlus, FileSignature, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";

interface DealSignatureRequestsTabProps {
  dealId: string;
}

type SignatureStatus = "pending" | "signed" | "declined" | "expired";

interface SignatureRequest {
  id: string;
  documentName: string;
  recipient: string;
  status: SignatureStatus;
  requestedAt: string;
  completedAt?: string;
}

export function DealSignatureRequestsTab({ dealId }: DealSignatureRequestsTabProps) {
  // Placeholder data - replace with actual API call
  const [signatureRequests] = useState<SignatureRequest[]>([
    {
      id: "1",
      documentName: "Purchase Agreement",
      recipient: "John Doe",
      status: "signed",
      requestedAt: "2024-01-15",
      completedAt: "2024-01-16",
    },
    {
      id: "2",
      documentName: "Loan Documents",
      recipient: "Jane Smith",
      status: "pending",
      requestedAt: "2024-01-20",
    },
    {
      id: "3",
      documentName: "Disclosure Form",
      recipient: "Bob Johnson",
      status: "declined",
      requestedAt: "2024-01-18",
      completedAt: "2024-01-19",
    },
  ]);

  const getStatusBadge = (status: SignatureStatus) => {
    switch (status) {
      case "signed":
        return (
          <Badge variant="default" className="gap-1">
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
    }
  };

  const pendingCount = signatureRequests.filter((r) => r.status === "pending").length;
  const completedCount = signatureRequests.filter((r) => r.status === "signed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Signature Requests</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage document signatures
          </p>
        </div>
        <Button size="sm">
          <FilePlus className="mr-2 h-4 w-4" />
          New Signature Request
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signatureRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
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
              <Button>
                <FilePlus className="mr-2 h-4 w-4" />
                New Signature Request
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {signatureRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-muted-foreground" />
                        {request.documentName}
                      </div>
                    </TableCell>
                    <TableCell>{request.recipient}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {request.completedAt
                        ? new Date(request.completedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
