import { Suspense } from "react";
import HistoricoPage from "../components/historico/HistoricoPage";
import HistoricoFallback from "../components/historico/HistoricoFallbak";


export default function Page() {
  return (
    <Suspense fallback={<HistoricoFallback />}>
      <HistoricoPage />
    </Suspense>
  );
}
