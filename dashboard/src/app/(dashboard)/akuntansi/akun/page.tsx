import { getAccountList } from "@/actions/akuntansi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AccountCreateForm } from "./ui/account-create-form"

function typeBadge(type: string) {
  const map: Record<string, { label: string; cls: string }> = {
    ASSET: { label: "Asset", cls: "bg-blue-100 text-blue-700" },
    LIABILITY: { label: "Liability", cls: "bg-purple-100 text-purple-700" },
    EQUITY: { label: "Equity", cls: "bg-slate-100 text-slate-700" },
    REVENUE: { label: "Revenue", cls: "bg-emerald-100 text-emerald-700" },
    EXPENSE: { label: "Expense", cls: "bg-rose-100 text-rose-700" },
  }
  const b = map[type] ?? { label: type, cls: "bg-muted text-foreground" }
  return <Badge className={`${b.cls} border-0`}>{b.label}</Badge>
}

export default async function AkunPage() {
  const accounts = await getAccountList()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daftar Akun (COA)</h1>
        <p className="text-muted-foreground text-sm">Master akun untuk pengelompokan laporan dan rekonsiliasi</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <AccountCreateForm />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Akun Aktif</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tipe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        Belum ada akun.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{a.code}</TableCell>
                        <TableCell className="text-sm font-medium">{a.name}</TableCell>
                        <TableCell>{typeBadge(a.type)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

