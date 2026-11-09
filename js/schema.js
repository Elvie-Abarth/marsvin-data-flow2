// Database schema (copied from marsvin-web/Data/Sql/schema.sql) shown in the side panel.
// ---------- Real schema (Data/Sql/schema.sql) ----------
const SCHEMA={
  Users:["UserId PK","Email (unique)","PasswordHash","DisplayName","Role (0 Customer, 1 Employee, 2 Admin)","IsActive","CreatedAt","LastActiveAt","InactivityWarningStage","TotpSecret (encrypted)","TotpEnabled","SecurityStamp","PrefersEnglish"],
  PendingLogins:["PendingLoginId PK","UserId FK","TokenHash (SHA-256)","ReturnUrl","ExpiresAt","CreatedAt"],
  Products:["ProductId PK","ProductType (1 Animal, 2 Stock)","Name / NameEn","Description / DescriptionEn","Price"],
  Animals:["ProductId PK/FK","Breed","Sex","DateOfBirth","Colour","Status (Available, Reserved, Sold, NotForSale)","BondedWithId","Personality","PhotoUrl"],
  StockProducts:["ProductId PK/FK","Sku (unique)","Category","StockQuantity (CHECK >= 0)","Unit","PhotoUrl","WeightGrams","Brand"],
  CartItems:["CartItemId PK","UserId FK","ProductId","Quantity (CHECK > 0)","AddedAt","UNIQUE(UserId, ProductId)"],
  Orders:["OrderId PK","UserId FK (NULL for guest / deleted account)","TotalPrice","CreatedAt","DeliveryMethod","ShippingAddress","ShippingCarrier","PaymentMethod","GuestName","GuestEmail","Status (Placed...Cancelled)","ShippingCost","ShippingWeightGrams","ParcelCount","ContactPhone","AgeConfirmed","TrackingNumber","CompanyName / CompanyCvr","PlacedInEnglish"],
  OrderItems:["OrderItemId PK","OrderId FK","ProductId (snapshot)","ProductName (snapshot)","UnitPrice (snapshot)","Quantity","IsAnimal"],
  Promotions:["PromotionId PK","Title","Description","DiscountPercent (1-100)","ProductId","StartDate","EndDate","IsActive"],
  Shifts:["ShiftId PK","UserId FK","StartAt","EndAt","Note","CreatedAt"],
  TimeOffRequests:["RequestId PK","UserId FK","StartDate","EndDate","Reason","Status (Pending, Approved, Denied)","RequestedAt","DecidedAt","DecidedByName"],
  AuditLog:["AuditLogId PK","ActorUserId","ActorName (snapshot)","Action e.g. Product.Deleted","Details","CreatedAt"],
  SecurityEvents:["SecurityEventId PK","Type (LoginFailed, AccountLocked, AccessDenied, RateLimited, AntiforgeryRejected)","Email","IpAddress","Path","Detail","CreatedAt"],
  ContactMessages:["ContactMessageId PK","Name","Email","Topic","OrderId (typed by sender, not FK)","Message","CreatedAt"],
  Donations:["DonationId PK","Kind (Money / Products)","AmountKr","ItemDescription","DonorName","DonorEmail","Message","CreatedAt"]
};
const TABLES=Object.keys(SCHEMA);
const PURPOSE={Users:"accounts & roles",PendingLogins:"email-link tokens",Products:"base catalog",Animals:"guinea pigs",StockProducts:"accessories & stock",CartItems:"logged-in carts",Orders:"orders & status",OrderItems:"order lines (snapshot)",Promotions:"discounts",Shifts:"staff schedule",TimeOffRequests:"day-off requests",AuditLog:"admin actions",SecurityEvents:"attack attempts",ContactMessages:"contact form",Donations:"demo donations"};
