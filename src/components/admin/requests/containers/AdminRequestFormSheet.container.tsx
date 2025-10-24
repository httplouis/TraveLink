"use client";

import * as React from "react";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import TravelOrderFormAdmin from "../forms/TravelOrderForm.ui";

type Props = { open: boolean; onClose: () => void };

export default function AdminRequestFormSheet({ open, onClose }: Props) {
  return (
    <Transition show={open}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="transition-opacity duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 sm:p-6">
            <TransitionChild
              enter="transition duration-200 ease-out"
              enterFrom="opacity-0 translate-y-2 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="transition duration-150 ease-in"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-2 sm:scale-95"
            >
              <DialogPanel className="w-full max-w-5xl rounded-2xl bg-neutral-50 p-4 sm:p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">New Travel Order</h2>
                  <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm hover:bg-neutral-100">
                    Close
                  </button>
                </div>
                <TravelOrderFormAdmin onClose={onClose} />
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
