import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./pages/layout";

const DynamicFormPage = lazy(() => import("./pages/work/dynamic-form/page"));
const NestedTablePage = lazy(() => import("./pages/work/nested-table/page"));
const DraggableLayoutPage = lazy(() => import("./pages/work/draggable-layout/page"));

export default function App() {
  return (
    <Suspense>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="work/form" element={<DynamicFormPage />} />
          <Route path="work/table" element={<NestedTablePage />} />
          <Route path="work/layout" element={<DraggableLayoutPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
