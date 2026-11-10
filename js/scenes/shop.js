// Scenes: Browsing and buying.
// Each scene = a title plus steps. A step moves the packet along `path`,
// marks tables as `read` / `write` / `active`, and shows a caption and the SQL.
defineScenes([
 {name:"Overview",title:"The big picture",steps:[
  {path:["customer","web"],cap:"The customer uses the webshop in the browser. Every click is an HTTP request to a Razor Page (ASP.NET Core 9, no JavaScript framework).",sql:"GET /Marsvin\nPOST /Cart\nPOST /Cart/Payment"},
  {path:["web","back"],cap:"The PageModel calls a Store through an interface (ICatalog, ICartStore, IOrderStore, IUserAccountStore ...). Stores are registered in Program.cs.",sql:"catalog.GetAnimals()\ncart.Add(...)\norders.Checkout(...)"},
  {path:["back"],cap:"Stores are the only code that talks to SQL. Plain ADO.NET with parameters, no ORM (course requirement). 15 shop tables (plus a small SeedBatches bookkeeping table).",sql:"SqlCommand + @parameters\nBEGIN TRANSACTION where needed",all:"read"},
  {path:["back","web","customer"],cap:"The result is rendered as HTML by Razor (output is encoded) and sent back with security headers and a CSP.",sql:"200 OK  (HTML)"}
 ]},
 {name:"Browse",title:"Browse guinea pigs and accessories",steps:[
  {path:["customer","web"],cap:"Customer opens /Marsvin, /Tilbehor or the home page. No login needed.",sql:"GET /Marsvin"},
  {path:["web","back"],cap:"The page asks ICatalog (SqlCatalog) for data.",sql:"catalog.GetAnimals()\ncatalog.GetAccessories()"},
  {path:["back","Products"],read:["Products","Animals"],cap:"Products is the base table, Animals holds the guinea-pig-specific fields (breed, sex, birth date, status).",sql:"SELECT p.ProductId, p.Name, p.Description,\n       p.DescriptionEn, p.Price,\n       a.Breed, a.Sex, a.DateOfBirth, a.Colour,\n       a.Status, a.BondedWithId,\n       a.Personality, a.PhotoUrl ...\nFROM dbo.Products p\nJOIN dbo.Animals a\n  ON a.ProductId = p.ProductId\nORDER BY p.ProductId;"},
  {path:["Products","back","web","customer"],cap:"The listing is rendered, with Danish/English text switched client-side (data-en attributes).",sql:"200 OK  (list)"}
 ]},
 {name:"Search",title:"Search accessories (/Tilbehor)",steps:[
  {path:["customer","web"],cap:"Customer types a search word and picks a category.",sql:"GET /Tilbehor?Query=hay&Category=..."},
  {path:["web","back","StockProducts"],read:["Products","StockProducts"],cap:"The accessory catalog is read from the database with fixed SQL - the search text never goes into a query.",sql:"SELECT p.ProductId, p.Name, p.NameEn,\n       p.Description, p.DescriptionEn, p.Price,\n       s.Sku, s.Category, s.StockQuantity,\n       s.Unit, s.PhotoUrl\nFROM dbo.Products p\nJOIN dbo.StockProducts s\n  ON s.ProductId = p.ProductId\nORDER BY p.ProductId;"},
  {path:["StockProducts","back"],active:["back","web"],cap:"The page model then filters the list in C# (name or description contains the term). Because it never becomes SQL, SQL injection is not possible.",sql:"a.Name.Contains(Query,\n   OrdinalIgnoreCase) ||\na.Description.Contains(Query, ...)"},
  {path:["back","web","customer"],cap:"Results are HTML-encoded by Razor, so a search term like <script> cannot run (XSS). CSP blocks inline scripts anyway.",sql:"200 OK  (filtered list)"}
 ]},
 {name:"Cart",title:"Add to cart (user story 4)",steps:[
  {path:["customer","web","back"],cap:"Customer clicks “Add to cart”. Guests are allowed: their cart lives in the server session (SessionCartStore), logged-in users use SQL (SqlCartStore).",sql:"POST /Cart\nProductId=15, Quantity=3"},
  {path:["back","Products"],read:["Products"],cap:"The product is looked up in the catalog. Name and price are never trusted from the browser. Adding one of a bonded guinea-pig pair adds its partner too.",sql:"SELECT ProductType FROM dbo.Products\nWHERE ProductId = @ProductId;"},
  {path:["Products","back","CartItems"],write:["CartItems"],cap:"Logged-in cart row is inserted, or its quantity increased if it already exists. A guinea pig stays at quantity 1. The database also enforces Quantity > 0 and one row per user+product.",sql:"MERGE dbo.CartItems AS target\nUSING (SELECT @UserId AS UserId,\n              @ProductId AS ProductId) AS source\n  ON target.UserId = source.UserId\n AND target.ProductId = source.ProductId\nWHEN MATCHED THEN\n  UPDATE SET Quantity = target.Quantity + @Quantity\nWHEN NOT MATCHED THEN\n  INSERT (UserId, ProductId, Quantity)\n  VALUES (@UserId, @ProductId, @Quantity);"},
  {path:["CartItems","back","CartItems"],read:["CartItems","Products"],cap:"The cart page reads the lines joined with Products, so prices always come from the catalog.",sql:"SELECT c.ProductId, c.Quantity, p.Name, p.Price,\n  CASE WHEN a.ProductId IS NULL\n       THEN 0 ELSE 1 END AS IsAnimal,\n  COALESCE(a.PhotoUrl, sp.PhotoUrl) AS PhotoUrl\nFROM dbo.CartItems c\nJOIN dbo.Products p ON p.ProductId = c.ProductId\nLEFT JOIN dbo.Animals a ...\nLEFT JOIN dbo.StockProducts sp ...\nWHERE c.UserId = @UserId\nORDER BY c.CartItemId;"},
  {path:["CartItems","back","web","customer"],cap:"The cart is tied to the user id from the session cookie, so nobody else can change it.",sql:"200 OK  (cart page)"}
 ]},
 {name:"Checkout",title:"Checkout (SqlOrderStore.Checkout)",steps:[
  {path:["customer","web","back"],cap:"Customer chooses delivery (pickup or shipping with PostNord / GLS / DAO), payment and contact phone on /Cart/Payment. Guests enter name and e-mail, companies can add name + CVR, and an order with a guinea pig needs an “I am 16 or older” tick. Payment is a demo (Card / MobilePay), no real card data is processed.",sql:"POST /Cart/Payment"},
  {path:["back"],active:["back"],cap:"One SQL transaction is opened. If anything fails, everything is rolled back.",sql:"connection.BeginTransaction();"},
  {path:["back","CartItems"],read:["CartItems","Products","Animals"],cap:"1. Cart lines are loaded inside the transaction, joined with Products and Animals (IsAnimal).",sql:"SELECT c.ProductId, c.Quantity, p.Name, p.Price,\n  CASE WHEN a.ProductId IS NULL\n       THEN 0 ELSE 1 END AS IsAnimal\nFROM dbo.CartItems c\nJOIN dbo.Products p ...\nLEFT JOIN dbo.Animals a ...\nWHERE c.UserId = @UserId;"},
  {path:["CartItems","back","StockProducts"],read:["StockProducts","Animals"],cap:"2. Every line is re-validated with UPDLOCK, HOLDLOCK so two buyers cannot take the last unit or the same guinea pig. Animals must be Available and at least 4 weeks old. Shipping is rejected if only animals are in the order.",sql:"SELECT StockQuantity\nFROM dbo.StockProducts\nWITH (UPDLOCK, HOLDLOCK)\nWHERE ProductId = @ProductId;"},
  {path:["StockProducts","back","Orders"],write:["Orders"],cap:"3. The server calculates shipping from the products’ WeightGrams (parcel count, carrier price) and the total from database prices. The order is created with Status = Placed. UserId is NULL for a guest.",sql:"INSERT INTO dbo.Orders\n(UserId, TotalPrice, ShippingCost,\n ParcelCount, DeliveryMethod,\n ShippingAddress, ShippingCarrier,\n PaymentMethod, ContactPhone,\n AgeConfirmed, CompanyName, CompanyCvr,\n GuestName, GuestEmail, ...)\nOUTPUT INSERTED.OrderId ..."},
  {path:["Orders","back","OrderItems"],write:["OrderItems"],cap:"4. Each line is saved as a snapshot (name, unit price). History stays correct even if the product is edited or deleted later.",sql:"INSERT INTO dbo.OrderItems\n(OrderId, ProductId, ProductName,\n UnitPrice, Quantity, IsAnimal)\nVALUES (...);"},
  {path:["OrderItems","back","StockProducts"],write:["StockProducts"],cap:"5. Stock goes down (20 → 17). An animal is instead set to Sold. A CHECK constraint keeps stock from going negative.",sql:"UPDATE dbo.StockProducts\nSET StockQuantity = StockQuantity - 3\nWHERE ProductId = 15;\n-- animals: SET Status = Sold",fx:()=>setStock(17)},
  {path:["StockProducts","back","CartItems"],write:["CartItems"],cap:"6. The cart is emptied, then the transaction is committed.",sql:"DELETE FROM dbo.CartItems\nWHERE UserId = @UserId;\nCOMMIT;"},
  {path:["CartItems","back","mail"],active:["mail"],cap:"A receipt e-mail goes to the buyer, in the language the site was in (PlacedInEnglish).",sql:"emailSender.SendAsync(...)"}
 ]},
 {name:"Order history",title:"Confirmation and order history (user story 8)",steps:[
  {path:["mail","back","web"],cap:"The customer is redirected to /Cart/Confirmation. A guest can only view it because the order id is stamped in their own session.",sql:"Session[\"GuestOrderId\"] == orderId"},
  {path:["web","back","Orders"],read:["Orders","OrderItems"],cap:"The receipt is read. For a signed-in user the store needs BOTH the order id and the session user id, so guessing another order id returns “not found” (IDOR protection).",sql:"order = FindById(orderId);\nreturn order.UserId == userId\n   ? order : null;"},
  {path:["Orders","back","OrderItems"],read:["OrderItems"],cap:"“My orders” on /Account/Profile lists only this user’s orders, newest first, with their lines.",sql:"SELECT OrderId, TotalPrice, CreatedAt ...\nFROM dbo.Orders\nWHERE UserId = @UserId\nORDER BY CreatedAt DESC, OrderId DESC;"},
  {path:["OrderItems","back","web","customer"],cap:"The page is rendered with the order Status (Placed, Processing, Sent, Delivered, Cancelled) and tracking number. IX_Orders_UserId makes this lookup fast.",sql:"200 OK  (orders)"}
 ]}
]);
