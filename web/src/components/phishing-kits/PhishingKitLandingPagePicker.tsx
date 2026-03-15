import { usePhishingKit } from "./PhishingKitContext";
import TemplatePicker from "./TemplatePicker";

export default function PhishingKitLandingPagePicker() {
  const { data, updateData } = usePhishingKit();

  return (
    <TemplatePicker
      templatePath="/templates/pages/"
      selectedId={data.landing_page_template_id}
      onSelect={(id, name) => {
        const isSameSelection = data.landing_page_template_id === id;
        updateData({
          landing_page_template_id: isSameSelection ? null : id,
          landing_page_template_name: isSameSelection ? null : name,
        });
      }}
    />
  );
}
