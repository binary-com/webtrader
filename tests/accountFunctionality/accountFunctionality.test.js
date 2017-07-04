import { before, after } from '../default';
import { login as loginTest } from './loginTest';
import { portfolio as portfolioTest } from './portfolioTest';
import { statement as statementTest } from './statementTest';
import { tokenManagement as tokenManagementTest } from './tokenManagementTest';
import { logout as logoutTest } from './logoutTest';
import { profitTable as profitTableTest } from './profitTableTest';

export default {
  before: before,
  after: after,
  'Login': loginTest,
  'Portfolio': portfolioTest,
  'Statement': statementTest,
  'Profit Table': profitTableTest,
  'Token Mangement': tokenManagementTest,
  'Logout': logoutTest
}
