import React from 'react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  Badge, 
  StatusIndicator, 
  Input, 
  Select, 
  Textarea, 
  FormGroup 
} from './index.js';

export const ComponentDemo: React.FC = () => {
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  return (
    <div className="p-8 space-y-8 bg-surface-bg min-h-screen">
      <h1 className="text-3xl font-bold text-text-primary">Component Library Demo</h1>
      
      {/* Button Examples */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Buttons</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" loading>Loading...</Button>
          </div>
        </CardBody>
      </Card>

      {/* Badge and Status Examples */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Badges & Status Indicators</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
            <div className="flex flex-wrap gap-4">
              <StatusIndicator status="on-track" />
              <StatusIndicator status="at-risk" />
              <StatusIndicator status="blocked" />
              <StatusIndicator status="complete" />
              <StatusIndicator status="archived" />
            </div>
            <div className="flex flex-wrap gap-4">
              <StatusIndicator status="on-track" showLabel={false} />
              <StatusIndicator status="at-risk" showLabel={false} />
              <StatusIndicator status="blocked" showLabel={false} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Form Examples */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Form Components</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-6 max-w-md">
            <FormGroup>
              <Input 
                label="Name" 
                placeholder="Enter your name" 
                required 
              />
            </FormGroup>
            
            <FormGroup>
              <Input 
                label="Email" 
                type="email" 
                placeholder="Enter your email" 
                error="Please enter a valid email address"
              />
            </FormGroup>
            
            <FormGroup>
              <Input 
                label="Phone" 
                placeholder="Enter your phone" 
                success 
                helperText="Phone number verified"
              />
            </FormGroup>
            
            <FormGroup>
              <Select 
                label="Country" 
                options={selectOptions} 
                placeholder="Select a country"
              />
            </FormGroup>
            
            <FormGroup>
              <Textarea 
                label="Message" 
                placeholder="Enter your message" 
                rows={4}
              />
            </FormGroup>
          </div>
        </CardBody>
        <CardFooter>
          <Button variant="primary">Submit Form</Button>
        </CardFooter>
      </Card>

      {/* Card Variants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="default">
          <CardHeader>
            <h3 className="font-semibold">Default Card</h3>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">This is a default card with standard styling.</p>
          </CardBody>
        </Card>
        
        <Card variant="elevated">
          <CardHeader>
            <h3 className="font-semibold">Elevated Card</h3>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">This card has elevated styling with more shadow.</p>
          </CardBody>
        </Card>
        
        <Card variant="outlined">
          <CardHeader>
            <h3 className="font-semibold">Outlined Card</h3>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">This card has outlined styling with border emphasis.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};