/*
*  Note: a duplicate of this file exists in the frontend root dir.
*  Any changes made here must be made there
*/

//Payment Method enum values
const CASH = 'Cash';
const MASTER_CARD = 'MC';
const VISA = 'Visa';
const AMERICAN_EXPRESS = 'Amex';
const DISCOVER = 'Disc';
const GOOGLE_PAY = 'Google';
const APPLE_PAY = 'Apple';
const VENMO = 'Venmo';

// User roles enum values
const TRAINEE = 'trainee';
const EMPLOYEE = 'employee';
const COOK = 'cook';
const HOST = 'host';
const SERVER = 'server';
const BARTENDER = 'bartender';
const HEAD_SERVER = 'head-server';
const BAR_MANAGER = 'bar-manager';
const CHEF = 'chef';
const MANAGER = 'manager';
const OWNER = 'owner';

// Terminal/Printer destination values
const KITCHEN_HOT = 'Kitchen-Hot';
const KITCHEN_COLD = 'Kitchen-Cold';
const BAR = 'Bar';
const NO_SEND = 'No-Send';

// Log Events enum values
const CLOCK_IN = 'clock-in';
const CLOCK_OUT = 'clock-out';
const CASH_OUT = 'cash-out';
const DECLARE_CASH_TIPS = 'declare-cash-tips';
const OPEN_SHIFT = 'open-shift';
const CLOSE_SHIFT = 'close-shift';
const OPEN_DAY = 'open-day';
const CLOSE_DAY = 'close-day';
const DISCOUNT_ITEM = 'discount-item';
const DISCOUNT_CHECK = 'discount-check';
const CREATE_ITEM = 'create-item';
const UPDATE_ITEM = 'update-item';
const DELETE_ITEM_ORDERED = 'delete-item-ordered';
const VOID_ITEM = 'void-item';
const VOID_CHECK = 'void-check';

module.exports = {
  CASH,
  MASTER_CARD,
  VISA,
  AMERICAN_EXPRESS,
  DISCOVER,
  GOOGLE_PAY,
  APPLE_PAY,
  VENMO,
  TRAINEE,
  EMPLOYEE,
  COOK,
  HOST,
  SERVER,
  BARTENDER,
  HEAD_SERVER,
  BAR_MANAGER,
  CHEF,
  MANAGER,
  OWNER,
  KITCHEN_HOT,
  KITCHEN_COLD,
  BAR,
  NO_SEND,
  CLOCK_IN,
  CLOCK_OUT,
  CASH_OUT,
  DECLARE_CASH_TIPS,
  OPEN_SHIFT,
  CLOSE_SHIFT,
  OPEN_DAY,
  CLOSE_DAY,
  DISCOUNT_ITEM,
  DISCOUNT_CHECK,
  CREATE_ITEM,
  UPDATE_ITEM,
  DELETE_ITEM_ORDERED,
  VOID_ITEM,
  VOID_CHECK
};
