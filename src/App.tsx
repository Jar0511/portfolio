import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./pages/layout";

const DynamicForm = lazy(() => import("./pages/work/dynamic-form/page"));
const NestedTable = lazy(() => import("./pages/work/nested-table/page"));
const DraggableLayout = lazy(() => import("./pages/work/draggable-layout/page"));

export default function App() {
  return (
    <Suspense>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="work/form" element={<DynamicForm />} />
          <Route path="work/table" element={<NestedTable />} />
          <Route path="work/layout" element={<DraggableLayout />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
