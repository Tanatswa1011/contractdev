import { create } from "zustand";
import { Contract, RiskLevel } from "@/types/contract";

export type ContractsViewMode = "table" | "timeline";

export interface DashboardFilters {
  search: string;
  status: "all" | "active" | "expired" | "pending" | "draft";
  vendor: "all" | string;
  risk: "all" | RiskLevel;
  onlyInRenewalWindow: boolean;
}

interface DashboardState {
  contracts: Contract[];
  selectedContractId: string | null;
  viewMode: ContractsViewMode;
  filters: DashboardFilters;
  setContracts: (contracts: Contract[]) => void;
  setSelectedContract: (id: string | null) => void;
  setViewMode: (mode: ContractsViewMode) => void;
  setFilters: (updater: (prev: DashboardFilters) => DashboardFilters) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  contracts: [],
  selectedContractId: null,
  viewMode: "table",
  filters: {
    search: "",
    status: "all",
    vendor: "all",
    risk: "all",
    onlyInRenewalWindow: false
  },
  setContracts: (contracts) =>
    set((state) => ({
      contracts,
      selectedContractId:
        contracts.find((contract) => contract.id === state.selectedContractId)?.id ??
        contracts[0]?.id ??
        null
    })),
  setSelectedContract: (id) => set({ selectedContractId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilters: (updater) =>
    set((state) => ({
      filters: updater(state.filters)
    }))
}));

export function useFilteredContracts() {
  const { contracts, filters } = useDashboardStore();
  const today = new Date();

  return contracts.filter((contract) => {
    const {
      search,
      status,
      vendor,
      risk,
      onlyInRenewalWindow
    } = filters;

    if (search) {
      const q = search.toLowerCase();
      if (
        !(
          contract.name.toLowerCase().includes(q) ||
          contract.vendor.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
    }

    if (status !== "all" && contract.status !== status) return false;
    if (vendor !== "all" && contract.vendor !== vendor) return false;
    if (risk !== "all" && contract.riskLevel !== risk) return false;

    if (onlyInRenewalWindow) {
      if (!contract.renewalDate) return false;
      const renewal = new Date(contract.renewalDate);
      const noticeStart = new Date(renewal);
      noticeStart.setDate(
        noticeStart.getDate() - contract.noticePeriodDays
      );
      if (!(today >= noticeStart && today <= renewal)) {
        return false;
      }
    }

    return true;
  });
}

export function useSelectedContract() {
  const { contracts, selectedContractId } = useDashboardStore();
  if (!contracts.length) return null;
  return (
    contracts.find((c) => c.id === selectedContractId) ??
    contracts[0]
  );
}


