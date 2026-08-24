import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./pages/layout";

const DynamicForm = lazy(() => import("./pages/work/dynamic-form/page"));

export default function App() {
  return (
    <Suspense>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="work/form" element={<DynamicForm />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
