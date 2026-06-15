import { useRef, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import {
  useAddPart,
  useRemovePart,
  useUpdatePart,
  type JobCard,
} from "../hooks/useJobCards";
import { usePartCatalog, type PartCatalogItem } from "../hooks/usePartCatalog";
import { useToast } from "../context/ToastContext";
import { useT } from "../i18n/useT";
import { Button } from "./ui";

interface Props {
  card: JobCard;
  isEditable: boolean;
}

const cellInput =
  "ring-1 ring-[var(--border)] rounded-[var(--r-control)] px-2 py-1.5 text-xs bg-[var(--surface)] text-[var(--text-strong)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]";

export default function PartsPanel({ card, isEditable }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [addError, setAddError] = useState("");
  const [suggestions, setSuggestions] = useState<PartCatalogItem[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  const addPart = useAddPart(card.id);
  const removePart = useRemovePart(card.id);
  const updatePart = useUpdatePart(card.id);
  const { data: catalog = [] } = usePartCatalog();
  const { toast } = useToast();
  const t = useT();

  const filterSuggestions = (val: string) => {
    if (!val.trim()) { setSuggestions([]); return; }
    const lower = val.toLowerCase();
    setSuggestions(catalog.filter((c) => c.name.toLowerCase().includes(lower)).slice(0, 5));
  };

  const selectCatalogItem = (item: PartCatalogItem) => {
    setName(item.name);
    setPrice(String(item.default_price));
    setSuggestions([]);
    setAddError("");
    nameInputRef.current?.focus();
  };

  const handleAdd = () => {
    const quantity = parseFloat(qty);
    const unit_price = parseFloat(price);
    if (!name.trim()) { setAddError(t("parts.errName")); return; }
    if (!price || isNaN(unit_price) || unit_price < 0) { setAddError(t("parts.errPrice")); return; }
    if (isNaN(quantity) || quantity <= 0) { setAddError(t("parts.errQty")); return; }
    setAddError("");

    addPart.mutate(
      { name: name.trim(), quantity, unit_price },
      {
        onSuccess: () => {
          setName(""); setQty("1"); setPrice(""); setAddError(""); setShowForm(false);
          toast(t("toast.partAdded"), "success");
        },
        onError: () => toast(t("toast.partAddFailed"), "error"),
      }
    );
  };

  const handleRemove = (partId: string) => {
    removePart.mutate(partId, {
      onError: () => toast(t("toast.partRemoveFailed"), "error"),
    });
  };

  const startEdit = (partId: string, partName: string, partQty: number, partPrice: number) => {
    setEditingId(partId);
    setEditName(partName);
    setEditQty(String(partQty));
    setEditPrice(String(partPrice));
    setShowForm(false);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = () => {
    if (!editingId) return;
    const quantity = parseFloat(editQty);
    const unit_price = parseFloat(editPrice);
    if (!editName.trim() || isNaN(quantity) || isNaN(unit_price) || unit_price < 0) return;

    updatePart.mutate(
      { partId: editingId, name: editName.trim(), quantity, unit_price },
      {
        onSuccess: () => { setEditingId(null); toast(t("toast.partUpdated"), "success"); },
        onError: () => toast(t("toast.partUpdateFailed"), "error"),
      }
    );
  };

  if (card.parts.length === 0 && !isEditable) return null;

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-3">
      <p className="text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wide mb-2">
        Parts
      </p>

      {card.parts.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {card.parts.map((p) =>
            isEditable && editingId === p.id ? (
              <div key={p.id} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t("parts.name")}
                  className={`flex-1 min-w-0 ${cellInput}`}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  placeholder={t("parts.qty")}
                  className={`w-12 ${cellInput}`}
                  min="0.01"
                  step="0.5"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder={t("parts.price")}
                  className={`w-16 ${cellInput}`}
                  min="0"
                />
                <Button
                  size="sm"
                  onClick={saveEdit}
                  loading={updatePart.isPending}
                  disabled={!editName.trim() || !editPrice}
                  className="shrink-0 px-2"
                >
                  {t("common.save")}
                </Button>
                <button onClick={cancelEdit} className="shrink-0 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div key={p.id} className="flex items-center gap-2 text-sm min-w-0">
                <span className="flex-1 text-[var(--text-strong)] truncate">{p.name}</span>
                <span className="text-[var(--text-faint)] shrink-0 text-xs tnum" data-keep-ltr>
                  {p.quantity} × {p.unit_price.toLocaleString()}
                </span>
                <span className="font-semibold text-[var(--text-strong)] shrink-0 text-xs w-16 text-right tnum" data-keep-ltr>
                  {p.line_total.toLocaleString()}
                </span>
                {isEditable && (
                  <>
                    <button
                      onClick={() => startEdit(p.id, p.name, p.quantity, p.unit_price)}
                      aria-label="Edit part"
                      className="text-[var(--text-faint)] hover:text-[var(--brand)] transition shrink-0"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={removePart.isPending}
                      aria-label="Remove part"
                      className="text-[var(--danger-fg)] hover:brightness-90 transition shrink-0 disabled:opacity-40"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            )
          )}
          <div className="flex justify-end text-xs font-semibold text-[var(--text-muted)] mt-1 pt-1.5 border-t border-[var(--border)]">
            <span className="tnum" data-keep-ltr>
              {t("parts.total")}: PKR {card.parts.reduce((s, p) => s + p.line_total, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {isEditable && !editingId && (
        <>
          {showForm ? (
            <div className="mt-2">
              <div className="grid grid-cols-[1fr_80px_100px_auto] sm:grid-cols-[1fr_80px_100px_auto] gap-1.5 items-start">
                <div className="min-w-0 relative col-span-1">
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder={t("parts.namePlaceholder")}
                    value={name}
                    onChange={(e) => { setName(e.target.value); setAddError(""); filterSuggestions(e.target.value); }}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                    className={`w-full min-w-0 ${cellInput}`}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-0.5 bg-[var(--surface)] ring-1 ring-[var(--border)] rounded-[var(--r-control)] shadow-[var(--shadow-md)] z-20 overflow-hidden">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={() => selectCatalogItem(item)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[var(--surface-2)] text-left transition"
                        >
                          <span className="text-[var(--text-strong)] truncate">{item.name}</span>
                          <span className="text-[var(--text-faint)] ms-2 shrink-0 tnum" data-keep-ltr>
                            PKR {item.default_price.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={t("parts.qty")}
                  value={qty}
                  onChange={(e) => { setQty(e.target.value); setAddError(""); }}
                  className={`w-full min-w-0 ${cellInput}`}
                  min="0.01"
                  step="0.5"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={t("parts.price")}
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setAddError(""); }}
                  className={`w-full min-w-0 ${cellInput}`}
                  min="0"
                />
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    loading={addPart.isPending}
                    className="shrink-0"
                  >
                    {t("common.add")}
                  </Button>
                  <button
                    onClick={() => { setShowForm(false); setName(""); setQty("1"); setPrice(""); setAddError(""); setSuggestions([]); }}
                    className="shrink-0 text-[var(--text-faint)] hover:text-[var(--text-muted)] transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              {addError && <p className="text-xs text-[var(--danger-fg)] mt-1">{addError}</p>}
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-[var(--brand)] font-semibold hover:underline mt-1"
            >
              <Plus size={12} />
              {t("parts.add")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
