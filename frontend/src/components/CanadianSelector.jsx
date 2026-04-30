const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NS",
  "NT",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
];

export default function CanadianSelector({ province, onChange }) {
  return (
    <label className="field-group" htmlFor="province">
      Canadian jurisdiction
      <select id="province" value={province} onChange={(event) => onChange(event.target.value)}>
        {PROVINCES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
