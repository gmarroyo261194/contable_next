import { getPagosHistory } from "@/lib/actions/pago-actions";
import { PagosClient } from "./PagosClient";

export default async function PagosPage() {
  const initialData = await getPagosHistory();

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
      <PagosClient initialData={initialData} />
    </div>
  );
}
