import DomainFinder from '@/components/domain-finder';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8 mt-[56px]">
        <div className="w-full max-w-2xl">
          <DomainFinder />
        </div>
      </main>
    </>
  );
}
