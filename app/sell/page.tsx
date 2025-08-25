import { WithAuth } from "@/components/with-auth";
import { SellFormContents } from "@/components/pesu-sell-form";

export default function SellPage() {
  return (
    <WithAuth>
      <SellFormContents />
    </WithAuth>
  );
}
