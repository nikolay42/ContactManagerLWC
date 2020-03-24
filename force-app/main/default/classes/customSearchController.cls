public with sharing class customSearchController {
    @AuraEnabled(cacheable=true)
    public static list<contact> searchContactsList(string searchKey) {
        string sTempSearchKey = '%' + searchKey + '%';

       // create contact list to store search result
        list<contact> lstContact = new list<contact>();

	   // query contact records
        for(contact oCon : [Select Id, Name, Email, Contact_Level__c, AccountId, Account.Name, OwnerId, Owner.Name, CreatedById, CreatedBy.Name, CreatedDate
                            FROM Contact
                            WHERE Name LIKE : sTempSearchKey]
                            ){
           lstContact.add(oCon);
        }

       //If there are no records found with searchKey then, throw aura exception with a message
         /*if(lstContact.size() == 0){
            throw new AuraHandledException('No Record Found..');
         }*/

        return lstContact;
    }
}
