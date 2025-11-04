"use client";

import { PageHeader, PageBody } from "@/components/common/Page";
import SubmissionsView from "@/components/user/submissions/SubmissionsView";
import BackToRequestButton from "@/components/common/buttons/BackToRequestButton.ui";

export default function SubmissionsPage() {
  return (
    <>
      <PageHeader
        title="My Submissions"
        actions={<BackToRequestButton />}
      />

      <PageBody>
        <SubmissionsView />
      </PageBody>
    </>
  );
}
