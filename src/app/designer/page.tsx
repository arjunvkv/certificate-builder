import { DesignerApp } from '@/components/designer/DesignerApp';
import { NoSSR } from '@/components/common/NoSSR';

export default function DesignerPage() {
  return (
    <NoSSR>
      <DesignerApp />
    </NoSSR>
  );
}