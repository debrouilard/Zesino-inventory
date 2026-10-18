import { PagePlaceholder } from '../components/ui/PagePlaceholder';

export const InventoryPage = () => (
  <PagePlaceholder
    title="Inventory"
    note="Product catalog, stock levels, and low-stock controls will land here from the next screenshot."
  />
);

export const PosPage = () => (
  <PagePlaceholder
    title="Point of Sale"
    note="The live POS workspace is scaffolded and waiting for the next UI reference."
  />
);

export const ReconciliationPage = () => (
  <PagePlaceholder
    title="Reconciliation"
    note="Count, variance, and adjustment flows will plug into the existing inventory movement APIs."
  />
);

export const CreditPage = () => (
  <PagePlaceholder
    title="Credit"
    note="Customer credit and receivables will extend the Customer model already in the backend."
  />
);

export const CustomersPage = () => (
  <PagePlaceholder
    title="Customer"
    note="Customer profiles are backed by /api/customers. Send the screenshot and this page can be completed."
  />
);

export const HelpPage = () => (
  <PagePlaceholder
    title="Help center"
    note="Operations documentation and support contacts will live in this panel."
  />
);
