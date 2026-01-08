import { Suspense } from "react";
import HistoricoPage from "../components/historico/HistoricoPage";
import HistoricoFallback from "../components/historico/HistoricoFallback";


export default function Page() {
  return (
    <Suspense fallback={<HistoricoFallback />}>
      <HistoricoPage />
    </Suspense>
  );
}
