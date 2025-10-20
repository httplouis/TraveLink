"use client";

import * as React from "react";
import ProfileSheetView from "./ui/ProfileSheetView";
import { useProfileSheet } from "./hooks/useProfileSheet";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { BRAND } from "@/lib/constants/brand";

type Props = { open: boolean; onClose: () => void };

export default function ProfileSheet({ open, onClose }: Props) {
  const hs = useProfileSheet({ open, onClose });

  return (
    <ProfileSheetView
      open={open}
      brand={BRAND}
      departments={DEPARTMENTS}
      state={{
        draft: hs.draft,
        orig: hs.orig,
        errors: hs.errors,
        isDirty: hs.isDirty,
        isInvalid: hs.isInvalid,
        showLogout: hs.showLogout,
        confirmSave: hs.confirmSave,
        confirmDiscard: hs.confirmDiscard,
      }}
      fmt={{
        fullName: hs.fullName,
        fmtJoined: hs.fmtJoined,
      }}
      handlers={{
        onCloseRequest: hs.requestClose,
        onAvatarPick: hs.onAvatarPick,
        setField: hs.setField,
        resetToOrig: hs.resetToOrig,
        requestSave: hs.requestSave,
        reallySave: hs.reallySave,
        reallyDiscard: hs.reallyDiscard,
        setShowLogout: hs.setShowLogout,
        doLogout: hs.doLogout,
        setConfirmSave: hs.setConfirmSave,
        setConfirmDiscard: hs.setConfirmDiscard,
      }}
    />
  );
}
