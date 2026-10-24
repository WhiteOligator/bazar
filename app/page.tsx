import { Button } from "@whiteoligator/drill-kit";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Bazar · шаг 0</h1>
      <Button variant="primary">Кнопка из drill-kit</Button>
    </main>
  );
}
