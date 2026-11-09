// Scenes: Staff and administration.
// Each scene = a title plus steps. A step moves the packet along `path`,
// marks tables as `read` / `write` / `active`, and shows a caption and the SQL.
defineScenes([
 {name:"Admin shop",title:"Shop administration (user story 9)",steps:[
  {path:["customer","web","back"],cap:"An Admin or Employee edits stock, or an Admin edits a product price.",sql:"POST /Admin/Products/Edit\nPOST /Admin/Stock"},
  {path:["back","Users"],read:["Users"],cap:"Role is checked on every request: [Authorize(Roles=\"Admin\")] or \"Admin,Employee\". Wrong role is redirected to /Account/AccessDenied. The cart pages also block staff accounts from buying.",sql:"[Authorize(Roles = \"Admin\")]\n-- claim Role from cookie"},
  {path:["Users","back","Products"],write:["Products","StockProducts"],cap:"The catalog row is updated with parameters.",sql:"UPDATE dbo.Products\nSET Price = @Price, Name = @Name ...\nWHERE ProductId = @id;"},
  {path:["Products","back","AuditLog"],write:["AuditLog"],cap:"Every admin write is logged with who did it and what (price, stock, status, deletion, role change). ActorName is a snapshot, so the entry survives if the account is deleted.",sql:"audit.Record(userId, name,\n  \"Product.Updated\", product.Name);"},
  {path:["AuditLog","back","web","customer"],cap:"The admin sees the updated list. A last active Admin cannot be demoted or deleted, so the shop always has an admin.",sql:"302 → /Admin/Products"}
 ]},
 {name:"Admin orders",title:"Order handling by staff",steps:[
  {path:["customer","web","back"],cap:"Staff open /Admin/Orders and move an order forward, and type in the carrier’s tracking number.",sql:"POST /Admin/Orders\n[Authorize(Roles = \"Admin,Employee\")]"},
  {path:["back","Orders"],read:["Orders","OrderItems"],cap:"All orders are listed with buyer (account or guest), delivery, parcels and status.",sql:"SELECT o.OrderId, o.Status, o.TotalPrice,\n       o.TrackingNumber, u.DisplayName ...\nFROM dbo.Orders o\nLEFT JOIN dbo.Users u ON u.UserId = o.UserId;"},
  {path:["Orders","back","Orders"],write:["Orders"],cap:"Status moves Placed → Processing → Sent / ready for pickup → Delivered (or Cancelled).",sql:"UPDATE dbo.Orders\nSET Status = @Status,\n    TrackingNumber = @Tracking\nWHERE OrderId = @OrderId;"},
  {path:["Orders","back","mail"],active:["mail"],cap:"The buyer gets a “your order was sent” e-mail in the language the order was placed in (a guest has no account to remember it on).",sql:"OrderEmails ... PlacedInEnglish"}
 ]},
 {name:"Logbog",title:"Audit log and monitoring (user story 10)",steps:[
  {path:["customer","web","back"],cap:"An Admin opens /Admin/AuditLog (“Logbog”). Admin only.",sql:"GET /Admin/AuditLog\n[Authorize(Roles = \"Admin\")]"},
  {path:["back","AuditLog"],read:["AuditLog"],cap:"The log is read newest first. The application never edits or deletes log rows.",sql:"SELECT ActorName, Action, Details, CreatedAt\nFROM dbo.AuditLog\nORDER BY CreatedAt DESC;"},
  {path:["AuditLog","back","web","customer"],cap:"Admins can see who changed what and when. Passwords are never written to logs.",sql:"200 OK  (log table)"}
 ]},
 {name:"Staff",title:"Staff schedule and day off",steps:[
  {path:["customer","web","back"],cap:"An Employee requests a day off on /Account/Profile. An Admin plans shifts on /Admin/Schedule.",sql:"POST Profile?handler=RequestTimeOff"},
  {path:["back","TimeOffRequests"],write:["TimeOffRequests"],cap:"The request is saved as Pending. Every active Admin gets an e-mail.",sql:"INSERT INTO dbo.TimeOffRequests\n(UserId, StartDate, EndDate, Reason)\nVALUES (...);"},
  {path:["TimeOffRequests","back","mail"],active:["mail"],cap:"Admins are notified.",sql:"emailSender -> all active Admins"},
  {path:["mail","back","Shifts"],write:["Shifts","TimeOffRequests"],cap:"Admin approves or denies, and creates shifts. Overlapping shifts or shifts on approved time off are rejected. The employee gets an e-mail for new or removed shifts.",sql:"INSERT INTO dbo.Shifts\n(UserId, StartAt, EndAt, Note) ...\nUPDATE dbo.TimeOffRequests\nSET Status = 1, DecidedByName = @admin ..."}
 ]},
 {name:"Contact & donations",title:"Contact form and donations",steps:[
  {path:["customer","web","back","ContactMessages"],write:["ContactMessages"],cap:"A public visitor sends a message. The order number is just text the sender typed - not proof the order is theirs.",sql:"INSERT INTO dbo.ContactMessages\n(Name, Email, Topic, OrderId, Message)\nVALUES (...);"},
  {path:["ContactMessages","back","Donations"],write:["Donations"],cap:"A donation for rehomed guinea pigs is a demo: recorded, never charged. Staff read both on /Admin/Messages and /Admin/Donations.",sql:"INSERT INTO dbo.Donations\n(Kind, AmountKr, DonorName, Message)\nVALUES (...);"}
 ]}
]);
