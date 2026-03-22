import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  AlignLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Image as ImageIcon,
  X
} from "lucide-react";
import { CATEGORY_OPTIONS, inputCls } from "@/components/content-manager/modules/module-creation/constants";
import { ContentFilePicker } from "@/components/content-manager/modules/module-creation/ContentFilePicker";
import { type CourseDifficulty } from "@/services/coursesApi";

const API_BASE = import.meta.env.VITE_API_URL as string;

interface CourseData {
  title: string;
  description: string;
  category: string;
  difficulty: CourseDifficulty;
  coverImageId: string | null;
  coverImageUrl: string | null;
  expectedTime: string;
}

function FormField({
  label,
  htmlFor,
  icon,
  isRequired,
  children
}: {
  readonly label: string;
  readonly htmlFor?: string;
  readonly icon?: React.ReactNode;
  readonly isRequired?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
      >
        {icon && <span className="text-[#A78BFA]">{icon}</span>}
        <span>
          {label}
          {isRequired && <span className="ml-0.5 text-amber-500">*</span>}
        </span>
      </label>
      {children}
    </div>
  );
}

function SidebarFields({
  data,
  onChange,
  onBrowseCover
}: {
  readonly data: CourseData;
  readonly onChange: (patch: Partial<CourseData>) => void;
  readonly onBrowseCover: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 px-3 py-4 overflow-y-auto flex-1"
    >
      <FormField label="Title" htmlFor="course-title" isRequired>
        <input
          id="course-title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Course title..."
          className={inputCls}
        />
      </FormField>

      {/* Cover image — clickable area */}
      <div className="relative group">
        <button
          type="button"
          onClick={onBrowseCover}
          className="relative w-full h-24 rounded-xl border-2 border-border hover:border-[#7C3AED]/60 overflow-hidden cursor-pointer transition-colors"
        >
          {data.coverImageUrl ? (
            <img
              src={data.coverImageUrl}
              alt="cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground group-hover:text-[#A78BFA] transition-colors">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px]">Click to choose cover</span>
            </div>
          )}
          {data.coverImageUrl && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </button>
        {data.coverImageUrl && (
          <button
            type="button"
            onClick={() => onChange({ coverImageUrl: null, coverImageId: null })}
            className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors z-10"
            aria-label="Remove cover image"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <FormField label="Category" htmlFor="course-category" isRequired>
        <select
          id="course-category"
          value={data.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className={inputCls}
        >
          <option value="">Select category</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Difficulty">
        <div className="flex p-1 bg-surface-subtle rounded-xl border border-border">
          {(["Easy", "Medium", "Hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ difficulty: d })}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                                ${data.difficulty === d
                  ? "bg-[#7C3AED] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                }`}
            >
              {d}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Expected Time" icon={<Clock className="w-3 h-3" />}>
        <div className="w-full rounded-lg border border-border bg-surface-subtle px-3 py-2 text-sm text-foreground flex items-center justify-between">
          <span>{data.expectedTime}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Auto</span>
        </div>
      </FormField>

      <FormField label="Description" htmlFor="course-description" isRequired>
        <textarea
          id="course-description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Brief description..."
          rows={6}
          className={`${inputCls} resize-none`}
        />
      </FormField>
    </motion.div>
  );
}

export function CourseDetailsSidebar({
  data,
  onChange,
  getToken
}: {
  readonly data: CourseData;
  readonly onChange: (patch: Partial<CourseData>) => void;
  readonly getToken?: () => string | undefined;
}) {
  const [open, setOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Load initial cover image URL if needed
  useEffect(() => {
    if (!data.coverImageId || data.coverImageUrl) return;
    const token = getToken?.();
    let revoked = false;
    fetch(
      `${API_BASE}/content/${encodeURIComponent(data.coverImageId)}/file-url`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }
    )
      .then((r) => r.ok ? r.json() as Promise<{ url: string | null }> : Promise.reject())
      .then((payload) => {
        if (!revoked && payload.url) {
          onChange({ coverImageUrl: payload.url });
        }
      })
      .catch(() => {});
    return () => { revoked = true; };
  }, [data.coverImageId, data.coverImageUrl, getToken, onChange]);

  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  return (
    <>
      <motion.div
        animate={{ width: open ? 260 : 52 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="shrink-0 h-full flex flex-col bg-surface border-r border-border overflow-hidden relative"
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-border">
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap"
              >
                Course Details
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={toggleOpen}
            className="ml-auto text-muted-foreground hover:text-[#A78BFA] transition-colors shrink-0"
            title={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>
        </div>

        {!open && (
          <div className="flex flex-col items-center gap-6 py-6 text-muted-foreground/50 flex-1">
            <ImageIcon className="w-4.5 h-4.5" />
            <Clock className="w-4.5 h-4.5" />
            <AlignLeft className="w-4.5 h-4.5" />
          </div>
        )}

        <AnimatePresence>
          {open && (
            <SidebarFields
              data={data}
              onChange={onChange}
              onBrowseCover={() => setPickerOpen(true)}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {pickerOpen && (
        <ContentFilePicker
          token={getToken?.() ?? ''}
          accept="image"
          onSelect={(url, item) => {
            onChange({ coverImageUrl: url, coverImageId: item.content_piece_id });
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
