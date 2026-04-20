import { getCompanyInfo } from "@/actions/settings"

export async function CompanyDocumentHeader({
  documentTitle,
  documentNumber,
}: {
  documentTitle: string
  documentNumber?: string
}) {
  const company = await getCompanyInfo()

  return (
    <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-6">
      <div className="flex items-start gap-4">
        {company.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoDataUrl}
            alt="Logo"
            className="h-14 w-14 rounded-md border border-slate-200 bg-white object-contain p-1"
          />
        ) : null}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
            {company.name || "Koperasi Simpan Pinjam"}
          </h1>
          {company.tagline ? (
            <p className="text-sm text-slate-600 mt-1">{company.tagline}</p>
          ) : null}
          {company.address ? (
            <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">
              {company.address}
            </p>
          ) : null}
          {(company.phone || company.email || company.website) ? (
            <p className="text-xs text-slate-500 mt-1">
              {[company.phone, company.email, company.website]
                .filter(Boolean)
                .join(" • ")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="text-right">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest">
          {documentTitle}
        </h2>
        {documentNumber ? (
          <p className="text-sm font-mono text-slate-600 mt-1">
            {documentNumber}
          </p>
        ) : null}
      </div>
    </div>
  )
}

