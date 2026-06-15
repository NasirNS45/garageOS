import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { JobCard } from "../hooks/useJobCards";
import type { Mechanic } from "../hooks/useMechanics";
import { JobDetailContent } from "./JobDetailSheet";
import { useT } from "../i18n/useT";
import ReviewSheet from "./ReviewSheet";
import { useState } from "react";

interface Props {
  card: JobCard | null;
  isOwner: boolean;
  mechanics: Mechanic[];
  onClose: () => void;
}

/** Persistent right-side detail panel — desktop only. */
export default function JobDetailPanel({ card, isOwner, mechanics, onClose }: Props) {
  const t = useT();
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {card && (
          <motion.aside
            key={card.id}
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="hidden lg:flex flex-col w-[var(--detail-panel-width)] xl:w-[500px] shrink-0 bg-[var(--surface)] border-s border-[var(--border)] overflow-hidden"
            style={{ height: "100vh" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border)] shrink-0">
              <span className="text-sm font-semibold text-[var(--text-strong)]">
                {t("job.detailTitle")}
              </span>
              <button
                onClick={onClose}
                aria-label={t("common.close")}
                className="w-7 h-7 rounded-[var(--r-card)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-strong)] transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <JobDetailContent
                card={card}
                isOwner={isOwner}
                mechanics={mechanics}
                onClose={onClose}
                onRequestReview={() => setReviewOpen(true)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {card && reviewOpen && (
        <ReviewSheet
          card={card}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          mechanics={mechanics}
        />
      )}
    </>
  );
}
