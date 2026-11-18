/**
 * A labeled, single-choice group of radio buttons ("pick one of these").
 *
 * Deliberately separate from the shared `.signup-form__checkbox` used for
 * consent: a consent checkbox is a single yes/no agreement whose label is
 * a sentence or two of text, so it top-aligns its control; a radio group
 * is a choice between short options, so each radio sits centered on its
 * one-line label and the options run in a row. Sized and typed to sit
 * inside a `.signup-form` alongside its text fields.
 *
 * Renders a `<fieldset>` + `<legend>` so screen readers announce the
 * question with each option. Controlled: pass `value` and `onChange`.
 *
 * Props:
 *   - name: string — shared `name` for the radio inputs.
 *   - legend: string — the question shown above the options.
 *   - options: { value: string, label: string }[]
 *   - value: string — the selected option's value ('' for none).
 *   - onChange: (value: string) => void
 *   - required?: boolean — marks the legend with an asterisk and sets
 *     `required` on the inputs.
 *   - disabled?: boolean — disables the whole group.
 */
export default function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  required = false,
  disabled = false,
}) {
  return (
    <fieldset className="radio-group" disabled={disabled}>
      <legend className="radio-group__legend">
        {legend}
        {required && <span className="radio-group__required" aria-hidden="true">*</span>}
      </legend>
      <div className="radio-group__options">
        {options.map((option) => (
          <label key={option.value} className="radio-group__option">
            <input
              type="radio"
              className="radio-group__input"
              name={name}
              value={option.value}
              required={required}
              checked={value === option.value}
              onChange={(event) => onChange(event.target.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
