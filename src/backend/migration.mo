import Map "mo:core/Map";

module {
  // Old PaymentRecord type (without txnDate field)
  type OldPaymentServiceType = { #consultoria; #mentoria };
  type OldPaymentStatus = { #pending; #confirmed; #rejected };
  type OldPaymentRecord = {
    id : Text;
    name : Text;
    email : Text;
    txnHash : Text;
    amountIcp : Text;
    serviceType : OldPaymentServiceType;
    status : OldPaymentStatus;
    timestamp : Int;
    notes : ?Text;
  };

  // New PaymentRecord type (with txnDate field)
  type NewPaymentServiceType = { #consultoria; #mentoria };
  type NewPaymentStatus = { #pending; #confirmed; #rejected };
  type NewPaymentRecord = {
    id : Text;
    name : Text;
    email : Text;
    txnHash : Text;
    amountIcp : Text;
    txnDate : Text;
    serviceType : NewPaymentServiceType;
    status : NewPaymentStatus;
    timestamp : Int;
    notes : ?Text;
  };

  type OldActor = {
    paymentRecords : Map.Map<Text, OldPaymentRecord>;
    var _stablePaymentRecords : [(Text, OldPaymentRecord)];
  };

  type NewActor = {
    paymentRecords : Map.Map<Text, NewPaymentRecord>;
    _stablePaymentRecords : [(Text, OldPaymentRecord)];
  };

  public func run(old : OldActor) : NewActor {
    let paymentRecords = old.paymentRecords.map<Text, OldPaymentRecord, NewPaymentRecord>(
      func(_key, rec) {
        { rec with txnDate = "" }
      }
    );
    {
      paymentRecords;
      _stablePaymentRecords = [];
    };
  };
};
