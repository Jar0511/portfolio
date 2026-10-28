import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./pages/layout";

const DynamicFormPage = lazy(() => import("./pages/work/dynamic-form/page"));
const NestedTablePage = lazy(() => import("./pages/work/nested-table/page"));
const DraggableLayoutPage = lazy(() => import("./pages/work/draggable-layout/page"));
const ClientSidePDFPage = lazy(() => import("./pages/work/client-side-pdf/page"));

export default function App() {
  return (
    <Suspense>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="work/form" element={<DynamicFormPage />} />
          <Route path="work/table" element={<NestedTablePage />} />
          <Route path="work/layout" element={<DraggableLayoutPage />} />
          <Route path="work/pdf" element={<ClientSidePDFPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
