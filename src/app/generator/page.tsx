import { GeneratorApp } from '@/components/generator/GeneratorApp';
import { NoSSR } from '@/components/common/NoSSR';

export default function GeneratorPage() {
  return (
    <NoSSR>
      <GeneratorApp />
    </NoSSR>
  );
}