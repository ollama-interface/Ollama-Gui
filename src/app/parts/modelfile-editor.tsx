import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modelfile, ModelfileParameter, ModelfileMessage } from "@/core/types";
import { buildModelFromFile } from "@/core/actions";
import { BuildProgressEvent } from "@/core/utils";
import { X, Plus } from "lucide-react";

interface ModelfileEditorProps {
  onModelCreated?: () => void;
  availableModels?: string[];
}

export const ModelfileEditor: React.FC<ModelfileEditorProps> = ({
  onModelCreated,
  availableModels = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [baseModel, setBaseModel] = useState("");
  const [parameters, setParameters] = useState<ModelfileParameter[]>([]);
  const [template, setTemplate] = useState("");
  const [system, setSystem] = useState("");
  const [adapter, setAdapter] = useState("");
  const [license, setLicense] = useState("");
  const [messages, setMessages] = useState<ModelfileMessage[]>([]);
  const [requires, setRequires] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState("");
  const [buildProgress, setBuildProgress] = useState(0);

  const handleAddParameter = () => {
    setParameters([...parameters, { name: "", value: "" }]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterChange = (
    index: number,
    field: "name" | "value",
    value: string | number,
  ): void => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleAddMessage = () => {
    setMessages([...messages, { role: "user", content: "" }]);
  };

  const handleRemoveMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index));
  };

  const handleMessageChange = (
    index: number,
    field: "role" | "content",
    value: string,
  ): void => {
    const updated = [...messages];
    if (field === "role") {
      updated[index] = {
        ...updated[index],
        role: value as "user" | "assistant" | "system",
      };
    } else {
      updated[index] = { ...updated[index], content: value };
    }
    setMessages(updated);
  };

  const handleBuildModel = async () => {
    const trimmedName = modelName.trim();

    if (!trimmedName) {
      alert("Please enter a model name");
      return;
    }

    // Validate model name format: must be lowercase alphanumeric with hyphens/underscores
    // Optional tag format: name:tag
    const modelNameRegex = /^[a-z0-9][a-z0-9._-]*(?::[a-z0-9][a-z0-9._-]*)?$/;
    if (!modelNameRegex.test(trimmedName)) {
      alert(
        "Invalid model name. Use lowercase letters, numbers, hyphens, underscores, and dots. " +
          "Optional format: name:tag (e.g., my-model or my-model:v1)",
      );
      return;
    }

    if (!baseModel.trim()) {
      alert("Please select a base model");
      return;
    }

    const modelfile: Modelfile = {
      from: baseModel,
      parameters: parameters.length > 0 ? parameters : undefined,
      template: template || undefined,
      system: system || undefined,
      adapter: adapter || undefined,
      license: license || undefined,
      messages: messages.length > 0 ? messages : undefined,
      requires: requires || undefined,
    };

    setIsBuilding(true);
    setBuildStatus("Starting build...");
    setBuildProgress(0);

    try {
      await buildModelFromFile(
        modelName,
        modelfile,
        (progress: BuildProgressEvent) => {
          setBuildStatus(progress.status || "Building...");
          if (
            progress.completed !== undefined &&
            progress.total !== undefined
          ) {
            const percent = (progress.completed / progress.total) * 100;
            setBuildProgress(percent);
          }
        },
      );

      setBuildProgress(100);
      setBuildStatus("Model created successfully!");
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
        onModelCreated?.();
      }, 1500);
    } catch (error) {
      console.error("Failed to build model:", error);
      setBuildStatus(error instanceof Error ? error.message : "Build failed");
    } finally {
      setIsBuilding(false);
    }
  };

  const resetForm = () => {
    setModelName("");
    setBaseModel("");
    setParameters([]);
    setTemplate("");
    setSystem("");
    setAdapter("");
    setLicense("");
    setMessages([]);
    setRequires("");
    setBuildStatus("");
    setBuildProgress(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Create Custom Model
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Model</DialogTitle>
          <DialogDescription>
            Build a custom model using Ollama Modelfile syntax
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Model Name */}
          <div>
            <label className="text-sm font-medium">Model Name</label>
            <Input
              placeholder="e.g., my-custom-model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={isBuilding}
            />
          </div>

          {/* Base Model */}
          <div>
            <label className="text-sm font-medium">Base Model (FROM)</label>
            <Select
              value={baseModel}
              onValueChange={setBaseModel}
              disabled={isBuilding}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a base model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              The base model to build from
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="text-sm font-medium">System Prompt</label>
            <Textarea
              placeholder="System message for the model"
              value={system}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSystem(e.target.value)
              }
              disabled={isBuilding}
              rows={3}
            />
          </div>

          {/* Template */}
          <div>
            <label className="text-sm font-medium">Template</label>
            <Textarea
              placeholder="e.g., {{ if .System }}<|im_start|>system {{ .System }}<|im_end|> {{ end }}{{ if .Prompt }}<|im_start|>user {{ .Prompt }}<|im_end|> {{ end }}<|im_start|>assistant"
              value={template}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTemplate(e.target.value)
              }
              disabled={isBuilding}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              Go template syntax for chat formatting
            </p>
          </div>

          {/* Parameters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Parameters</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddParameter}
                disabled={isBuilding}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {parameters.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Parameter name (e.g., temperature)"
                    value={param.name}
                    onChange={(e) =>
                      handleParameterChange(index, "name", e.target.value)
                    }
                    disabled={isBuilding}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    value={param.value}
                    onChange={(e) =>
                      handleParameterChange(index, "value", e.target.value)
                    }
                    disabled={isBuilding}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveParameter(index)}
                    disabled={isBuilding}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Adapter */}
          <div>
            <label className="text-sm font-medium">Adapter (Optional)</label>
            <Input
              placeholder="Path to adapter file"
              value={adapter}
              onChange={(e) => setAdapter(e.target.value)}
              disabled={isBuilding}
            />
          </div>

          {/* License */}
          <div>
            <label className="text-sm font-medium">License (Optional)</label>
            <Textarea
              placeholder="License text"
              value={license}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setLicense(e.target.value)
              }
              disabled={isBuilding}
              rows={2}
            />
          </div>

          {/* Messages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Messages (Optional)</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddMessage}
                disabled={isBuilding}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className="flex gap-2">
                  <Select
                    value={msg.role}
                    onValueChange={(value) =>
                      handleMessageChange(index, "role", value)
                    }
                    disabled={isBuilding}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">user</SelectItem>
                      <SelectItem value="assistant">assistant</SelectItem>
                      <SelectItem value="system">system</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Message content"
                    value={msg.content}
                    onChange={(e) =>
                      handleMessageChange(index, "content", e.target.value)
                    }
                    disabled={isBuilding}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMessage(index)}
                    disabled={isBuilding}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Requires */}
          <div>
            <label className="text-sm font-medium">Requires (Optional)</label>
            <Input
              placeholder="Minimum Ollama version"
              value={requires}
              onChange={(e) => setRequires(e.target.value)}
              disabled={isBuilding}
            />
          </div>

          {/* Build Status */}
          {isBuilding && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">{buildStatus}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${buildProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Build Button */}
          <Button
            onClick={handleBuildModel}
            disabled={isBuilding}
            className="w-full"
          >
            {isBuilding ? "Building..." : "Create Model"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
