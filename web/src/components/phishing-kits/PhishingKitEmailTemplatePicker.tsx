import { usePhishingKit } from "./PhishingKitContext";
import TemplatePicker from "./TemplatePicker";

export default function PhishingKitEmailTemplatePicker() {
  const { data, updateData } = usePhishingKit();

  return (
    <TemplatePicker
      templatePath="/templates/emails/"
      selectedId={data.email_template_id}
      onSelect={(id, name) => {
        const isSameSelection = data.email_template_id === id;
        updateData({
          email_template_id: isSameSelection ? null : id,
          email_template_name: isSameSelection ? null : name,
        });
      }}
    />
  );
}
