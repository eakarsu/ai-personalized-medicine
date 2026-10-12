import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-pharmacogenomics","title":"Pharmacogenomics-Aware Rx","description":"Prepare a professional advisory report for pharmacogenomics-aware rx using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfPharmacogenomics({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
