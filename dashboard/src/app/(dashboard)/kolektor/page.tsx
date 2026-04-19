import {
  getDaftarKolektor,
  getSumberKolektorOptions,
  getUserRoleTable,
} from "@/actions/kolektor"
import { KolektorManagement } from "./kolektor-management"

export default async function KolektorPage() {
  const [kolektorList, sumberOptions, roleTable] = await Promise.all([
    getDaftarKolektor(),
    getSumberKolektorOptions(),
    getUserRoleTable(),
  ])

  return (
    <KolektorManagement
      initialKolektor={kolektorList}
      sumberOptions={sumberOptions}
      roleTable={roleTable}
    />
  )
}
