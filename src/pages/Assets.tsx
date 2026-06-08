import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Copy, Search } from "lucide-react";
import { assets } from "@/lib/mockData";
import { toast } from "sonner";

const allTags = ["全部", "沙发垫", "沙发巾", "飘窗垫", "凉豆豆", "中古风", "摩卡", "庄园"];

export default function Assets() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("全部");
  const filtered = assets.filter(a =>
    (tag === "全部" || a.tags.includes(tag)) && a.name.includes(q)
  );
  return (
    <div>
      <PageHeader title="图片素材库" description="主图/场景图/详情图统一管理，按标签检索"
        actions={<Button onClick={() => toast.success("上传素材（示例）")}><Upload className="h-4 w-4 mr-1" />上传素材</Button>} />
      <Card className="p-4 mb-4 bg-card/60 border-border/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索素材名" className="pl-8" />
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(t => (
              <Badge key={t} onClick={() => setTag(t)}
                className={`cursor-pointer ${tag === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map(a => (
          <Card key={a.id} className="overflow-hidden bg-card/60 border-border/60 group">
            <div className="aspect-square overflow-hidden">
              <img src={a.url} className="w-full h-full object-cover group-hover:scale-105 transition" />
            </div>
            <div className="p-2 space-y-1">
              <div className="text-xs truncate">{a.name}</div>
              <div className="flex flex-wrap gap-1">
                {a.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>)}
              </div>
              <Button size="sm" variant="ghost" className="w-full h-7 text-xs"
                onClick={() => { navigator.clipboard.writeText(a.url); toast.success("已复制链接"); }}>
                <Copy className="h-3 w-3 mr-1" />复制链接
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}