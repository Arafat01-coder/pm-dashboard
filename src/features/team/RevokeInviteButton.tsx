"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";

export function RevokeInviteButton({ id, email }: { id: string; email: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isRevoking, setRevoking] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      isLoading={isRevoking}
      onClick={async () => {
        setRevoking(true);
        const result = await apiFetch(`/api/invitations/${id}`, { method: "DELETE" });
        setRevoking(false);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`Invitation for ${email} revoked`);
        router.refresh();
      }}
    >
      Revoke
    </Button>
  );
}
