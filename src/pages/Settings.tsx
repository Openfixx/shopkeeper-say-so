import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import ShopTypeChanger from '@/components/ui-custom/ShopTypeChanger';
import { useLanguage } from '@/context/LanguageContext';

const Settings = () => {
  const [profileName, setProfileName] = useState('John Doe');
  const [profileEmail, setProfileEmail] = useState('john.doe@example.com');
  const [currency, setCurrency] = useState('USD');
  const { language, t } = useLanguage();
  const [currentShopType, setCurrentShopType] = useState(localStorage.getItem('shop_niche') || 'grocery');

  const handleShopTypeChange = (type: string) => {
    localStorage.setItem('shop_niche', type);
    setCurrentShopType(type);
    toast.success(`Shop type updated to ${type}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {language === 'hi-IN' ? 'सेटिंग्स' : 'Settings'}
        </h2>
        <p className="text-muted-foreground">
          {language === 'hi-IN' 
            ? 'अपने खाते और एप्लिकेशन सेटिंग्स को प्रबंधित करें'
            : 'Manage your account and application settings'}
        </p>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            {language === 'hi-IN' ? 'सामान्य' : 'General'}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            {language === 'hi-IN' ? 'दिखावट' : 'Appearance'}
          </TabsTrigger>
          <TabsTrigger value="billing">
            {language === 'hi-IN' ? 'बिलिंग' : 'Billing'}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {language === 'hi-IN' ? 'सूचनाएँ' : 'Notifications'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          {/* Shop Type */}
          <ShopTypeChanger 
            currentType={currentShopType}
            onTypeChange={handleShopTypeChange}
          />
          
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'hi-IN' ? 'प्रोफ़ाइल' : 'Profile'}</CardTitle>
              <CardDescription>
                {language === 'hi-IN'
                  ? 'अपनी प्रोफ़ाइल जानकारी अपडेट करें'
                  : 'Update your profile information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{language === 'hi-IN' ? 'नाम' : 'Name'}</Label>
                <Input
                  id="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{language === 'hi-IN' ? 'ईमेल' : 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
              <Button>{language === 'hi-IN' ? 'प्रोफ़ाइल अपडेट करें' : 'Update Profile'}</Button>
            </CardContent>
          </Card>
          
          {/* Currency Section */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'hi-IN' ? 'मुद्रा' : 'Currency'}</CardTitle>
              <CardDescription>
                {language === 'hi-IN'
                  ? 'अपनी डिफ़ॉल्ट मुद्रा बदलें'
                  : 'Change your default currency'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">{language === 'hi-IN' ? 'मुद्रा' : 'Currency'}</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>
              <Button>{language === 'hi-IN' ? 'मुद्रा अपडेट करें' : 'Update Currency'}</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'hi-IN' ? 'दिखावट' : 'Appearance'}</CardTitle>
              <CardDescription>
                {language === 'hi-IN'
                  ? 'अपने एप्लिकेशन की दिखावट को अनुकूलित करें'
                  : 'Customize the appearance of your application'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {language === 'hi-IN' ? 'दिखावट सेटिंग्स' : 'Appearance Settings'}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'hi-IN' ? 'बिलिंग' : 'Billing'}</CardTitle>
              <CardDescription>
                {language === 'hi-IN'
                  ? 'अपनी बिलिंग जानकारी प्रबंधित करें'
                  : 'Manage your billing information'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {language === 'hi-IN' ? 'बिलिंग सेटिंग्स' : 'Billing Settings'}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'hi-IN' ? 'सूचनाएँ' : 'Notifications'}</CardTitle>
              <CardDescription>
                {language === 'hi-IN'
                  ? 'अपनी सूचना प्राथमिकताएँ कॉन्फ़िगर करें'
                  : 'Configure your notification preferences'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {language === 'hi-IN' ? 'सूचना सेटिंग्स' : 'Notification Settings'}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
