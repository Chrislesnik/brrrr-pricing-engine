import { Toolbar } from "basehub/next-toolbar";

interface BaseHubToolbarWrapperProps {
  searchKey: string;
}

export async function BaseHubToolbarWrapper({ searchKey }: BaseHubToolbarWrapperProps) {
  return <Toolbar searchKey={searchKey} />;
}
