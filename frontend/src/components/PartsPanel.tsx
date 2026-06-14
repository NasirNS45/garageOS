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

interface Props {
  card: JobCard;
  isEditable: boolean;
}

const cellInput =
  "border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]";

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
    <div className="mt-3 border-t border-slate-100 dark:border-slate-700 pt-3">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">
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
                <button
                  onClick={saveEdit}
                  disabled={updatePart.isPending || !editName.trim() || !editPrice}
                  className="shrink-0 bg-[var(--brand)] text-white text-xs font-semibold px-2 py-1.5 rounded-lg hover:bg-[var(--brand-hover)] transition disabled:opacity-50"
                >
                  {updatePart.isPending ? "…" : t("common.save")}
                </button>
                <button onClick={cancelEdit} className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div key={p.id} className="flex items-center gap-2 text-sm min-w-0">
                <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                <span className="text-slate-400 shrink-0 text-xs">
                  {p.quantity} × {p.unit_price.toLocaleString()}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0 text-xs w-16 text-right">
                  {p.line_total.toLocaleString()}
                </span>
                {isEditable && (
                  <>
                    <button
                      onClick={() => startEdit(p.id, p.name, p.quantity, p.unit_price)}
                      aria-label="Edit part"
                      className="text-slate-400 hover:text-[var(--brand)] transition shrink-0"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleRemove(p.id)}
                      disabled={removePart.isPending}
                      aria-label="Remove part"
                      className="text-red-400 hover:text-red-600 transition shrink-0 disabled:opacity-40"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            )
          )}
          <div className="flex justify-end text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-700">
            {t("parts.total")}: PKR {card.parts.reduce((s, p) => s + p.line_total, 0).toLocaleString()}
          </div>
        </div>
      )}

      {isEditable && !editingId && (
        <>
          {showForm ? (
            <div className="mt-2">
              <div className="flex items-start gap-1.5">
                {/* Name with catalog autocomplete */}
                <div className="flex-1 min-w-0 relative">
                  <input
                    ref={nameInputRef}
                    type="text"
                    placeholder={t("parts.namePlaceholder")}
                    value={name}
                    onChange={(e) => { setName(e.target.value); setAddError(""); filterSuggestions(e.target.value); }}
                    onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                    className={`w-full ${cellInput}`}
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-20 overflow-hidden">
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={() => selectCatalogItem(item)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition"
                        >
                          <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-2 shrink-0">
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
                  className={`w-12 ${cellInput}`}
                  min="0.01"
                  step="0.5"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={t("parts.price")}
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setAddError(""); }}
                  className={`w-16 ${cellInput}`}
                  min="0"
                />
                <button
                  onClick={handleAdd}
                  disabled={addPart.isPending}
                  className="shrink-0 bg-[var(--brand)] text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[var(--brand-hover)] transition disabled:opacity-50"
                >
                  {addPart.isPending ? "…" : t("common.add")}
                </button>
                <button
                  onClick={() => { setShowForm(false); setName(""); setQty("1"); setPrice(""); setAddError(""); setSuggestions([]); }}
                  className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition"
                >
                  <X size={14} />
                </button>
              </div>
              {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
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
