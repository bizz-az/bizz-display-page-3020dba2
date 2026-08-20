/**
 * Business scope questions rendered inside the "Create account" drawer.
 *
 * Pure presentation over the existing capability engine: it collects the same
 * BusinessCharacteristics + plan the Administration → Settings panel edits.
 */

import {
  OPERATIONAL_FLAG_LABELS, PLANS, resolveScope, MODULE_REGISTRY,
  type BusinessCharacteristics, type OperationalFlags, type PlanKey,
} from "@/lib/business-scope";
import { BUSINESS_TYPES, LEGAL_FORMS, SECTORS } from "@/components/compliance/compliance-provider";

export const TAX_REGISTRATIONS = ["TIN", "VAT", "PAYE", "SDL", "WHT"];

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-amber-400/60";
const labelCls = "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/55";

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-medium transition ${
    active
      ? "border-amber-300/60 bg-amber-400/20 text-amber-200"
      : "border-white/15 bg-white/[0.05] text-white/70 hover:bg-white/10"
  }`;

export function BusinessProfileStep({
  value,
  onChange,
}: {
  value: BusinessCharacteristics;
  onChange: (patch: Partial<BusinessCharacteristics>) => void;
}) {
  const toggleReg = (reg: string) => {
    const list = value.taxRegistrations.includes(reg)
      ? value.taxRegistrations.filter((r) => r !== reg)
      : [...value.taxRegistrations, reg];
    onChange({ taxRegistrations: list });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/55">
        This decides which modules your workspace will include. You can change it later in
        Administration → Settings.
      </p>

      <div>
        <span className={labelCls}>Business name</span>
        <input
          className={inputCls}
          placeholder="e.g. Kambona Traders"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className={labelCls}>Legal form</span>
          <select
            className={inputCls}
            value={value.legalForm}
            onChange={(e) => onChange({ legalForm: e.target.value })}
          >
            <option value="">Select…</option>
            {LEGAL_FORMS.map((item) => (
              <option key={item} value={item} className="bg-neutral-900">
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelCls}>Business type</span>
          <select
            className={inputCls}
            value={value.businessType}
            onChange={(e) => onChange({ businessType: e.target.value })}
          >
            <option value="">Select…</option>
            {BUSINESS_TYPES.map((item) => (
              <option key={item} value={item} className="bg-neutral-900">
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelCls}>Sector</span>
          <select
            className={inputCls}
            value={value.sector}
            onChange={(e) => onChange({ sector: e.target.value })}
          >
            <option value="">Select…</option>
            {SECTORS.map((item) => (
              <option key={item} value={item} className="bg-neutral-900">
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelCls}>Employees</span>
          <input
            className={inputCls}
            type="number"
            min={0}
            placeholder="0"
            value={value.employeeCount ?? ""}
            onChange={(e) =>
              onChange({ employeeCount: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div>
        <span className={labelCls}>Tax registrations</span>
        <div className="flex flex-wrap gap-2">
          {TAX_REGISTRATIONS.map((reg) => (
            <button
              key={reg}
              type="button"
              className={chip(value.taxRegistrations.includes(reg))}
              onClick={() => toggleReg(reg)}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={chip(value.doesImport)}
          onClick={() => onChange({ doesImport: !value.doesImport })}
        >
          Imports goods
        </button>
        <button
          type="button"
          className={chip(value.doesExport)}
          onClick={() => onChange({ doesExport: !value.doesExport })}
        >
          Exports goods
        </button>
      </div>
    </div>
  );
}

export function OperationsStep({
  value,
  plan,
  onChange,
  onPlanChange,
}: {
  value: BusinessCharacteristics;
  plan: PlanKey;
  onChange: (patch: Partial<BusinessCharacteristics>) => void;
  onPlanChange: (plan: PlanKey) => void;
}) {
  const flags = value.flags;
  const scope = resolveScope({ ...value, unconfigured: false }, plan);
  const included = MODULE_REGISTRY.filter((m) => scope.modules[m.key]?.allowed !== false);
  const excluded = MODULE_REGISTRY.filter((m) => scope.modules[m.key]?.allowed === false);

  return (
    <div className="space-y-4">
      <div>
        <span className={labelCls}>How does the business operate?</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(OPERATIONAL_FLAG_LABELS) as (keyof OperationalFlags)[]).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/85"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-amber-400"
                checked={flags[key] ?? false}
                onChange={(e) =>
                  onChange({ flags: { ...flags, [key]: e.target.checked } })
                }
              />
              <span>{OPERATIONAL_FLAG_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className={labelCls}>Plan</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={chip(plan === key)}
              onClick={() => onPlanChange(key)}
            >
              {PLANS[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">
          Your workspace will include
        </p>
        <p className="mt-1.5 text-sm text-white/85">
          {included.map((m) => m.name).join(" · ") || "Nothing yet — answer the questions above"}
        </p>
        {excluded.length > 0 && (
          <p className="mt-2 text-xs text-white/45">Hidden for now: {excluded.map((m) => m.name).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
