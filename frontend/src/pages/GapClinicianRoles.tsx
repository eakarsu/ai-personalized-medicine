import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-clinician-roles","title":"Clinician vs Patient Roles","description":"Prepare a professional advisory report for clinician vs patient roles using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapClinicianRoles({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
