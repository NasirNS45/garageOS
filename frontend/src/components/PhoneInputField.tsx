import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

/**
 * International phone number input with Pakistan as the default country.
 * Outputs E.164 format (e.g. +923001234567).
 * Caller is responsible for rendering the label and error message.
 */
export default function PhoneInputField({
  value,
  onChange,
  error = false,
  disabled = false,
  id,
  ariaLabel,
  ariaDescribedBy,
}: Props) {
  return (
    <div className="phone-field-ltr w-full">
      <PhoneInput
        defaultCountry="pk"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`phone-field${error ? " phone-field-error" : ""}`}
        inputProps={{
          id,
          "aria-label": ariaLabel,
          "aria-describedby": ariaDescribedBy,
          "aria-invalid": error || undefined,
        }}
      />
    </div>
  );
}
